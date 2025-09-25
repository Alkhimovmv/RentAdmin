#!/bin/bash

# Исправление проблемы с SSL сертификатом ERR_CERT_AUTHORITY_INVALID
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"

echo "🔒 Исправление SSL сертификата..."

ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    echo "📁 Создание директории для SSL..."
    sudo mkdir -p /etc/nginx/ssl

    echo "🔑 Генерация нового SSL сертификата с правильными параметрами..."

    # Создаём конфигурационный файл для сертификата
    sudo tee /tmp/ssl.conf > /dev/null << 'SSL_CONF'
[req]
default_bits = 2048
prompt = no
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]
C = RU
ST = Moscow
L = Moscow
O = RentAdmin
OU = Development
CN = 87.242.103.146

[v3_req]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = 87.242.103.146
DNS.1 = localhost
SSL_CONF

    echo "🔐 Генерация приватного ключа..."
    sudo openssl genrsa -out /etc/nginx/ssl/server.key 2048

    echo "📋 Создание запроса на сертификат..."
    sudo openssl req -new -key /etc/nginx/ssl/server.key -out /tmp/server.csr -config /tmp/ssl.conf

    echo "✍️ Подпись сертификата..."
    sudo openssl x509 -req -in /tmp/server.csr -signkey /etc/nginx/ssl/server.key \
        -out /etc/nginx/ssl/server.crt -days 365 \
        -extensions v3_req -extfile /tmp/ssl.conf

    echo "🔧 Установка правильных прав доступа..."
    sudo chmod 600 /etc/nginx/ssl/server.key
    sudo chmod 644 /etc/nginx/ssl/server.crt
    sudo chown root:root /etc/nginx/ssl/server.*

    echo "🧹 Очистка временных файлов..."
    sudo rm -f /tmp/server.csr /tmp/ssl.conf

    echo "✅ Информация о сертификате:"
    sudo openssl x509 -in /etc/nginx/ssl/server.crt -text -noout | grep -A 5 "Subject:"
    sudo openssl x509 -in /etc/nginx/ssl/server.crt -text -noout | grep -A 5 "X509v3 Subject Alternative Name"

    echo "🔄 Перезагрузка nginx..."
    sudo nginx -t && sudo systemctl reload nginx

    echo "🧪 Тест HTTPS соединения..."
    openssl s_client -connect localhost:443 -servername 87.242.103.146 < /dev/null 2>/dev/null | openssl x509 -noout -subject -dates

    echo "📊 Статус nginx:"
    sudo systemctl status nginx --no-pager | head -3

    echo -e "\n💡 Для решения проблемы в браузере:"
    echo "1. Перейдите по адресу https://87.242.103.146"
    echo "2. Нажмите 'Дополнительно' или 'Advanced'"
    echo "3. Выберите 'Перейти на сайт (небезопасно)' или 'Proceed to site (unsafe)'"
    echo "4. Или добавьте сертификат в доверенные в настройках браузера"
EOF

echo "🎉 SSL сертификат обновлен!"
echo "⚠️ Это самоподписанный сертификат - браузеры будут показывать предупреждение"
echo "✅ Сертификат теперь содержит правильные Subject Alternative Names"
echo "🌐 Проверьте: https://87.242.103.146/api/health"
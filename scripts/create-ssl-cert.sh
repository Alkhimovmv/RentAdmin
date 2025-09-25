#!/bin/bash

# Создание самоподписанного SSL сертификата для IP 87.242.103.146
# с правильными параметрами для минимизации предупреждений браузера

set -e

IP="87.242.103.146"
CERT_DIR="./nginx/ssl"
DAYS=365

echo "🔐 Создание SSL сертификата для IP: $IP"

# Создаем директорию для сертификатов
mkdir -p $CERT_DIR

# Создаем конфигурационный файл для сертификата
cat > "$CERT_DIR/cert.conf" << EOF
[req]
default_bits = 2048
prompt = no
distinguished_name = req_distinguished_name
req_extensions = v3_req

[req_distinguished_name]
C=RU
ST=Moscow
L=Moscow
O=RentAdmin
OU=Development
CN=$IP

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = $IP
IP.2 = 127.0.0.1
DNS.1 = localhost
EOF

# Генерируем приватный ключ
echo "📝 Генерация приватного ключа..."
openssl genrsa -out "$CERT_DIR/key.pem" 2048

# Генерируем сертификат
echo "📜 Генерация сертификата..."
openssl req -new -x509 \
    -key "$CERT_DIR/key.pem" \
    -out "$CERT_DIR/cert.pem" \
    -days $DAYS \
    -config "$CERT_DIR/cert.conf" \
    -extensions v3_req

# Проверяем созданный сертификат
echo "✅ Проверка сертификата:"
openssl x509 -in "$CERT_DIR/cert.pem" -text -noout | grep -A 3 "Subject Alternative Name"

echo "🎉 Сертификат создан успешно!"
echo "📁 Файлы сертификата:"
echo "   - Приватный ключ: $CERT_DIR/key.pem"
echo "   - Сертификат: $CERT_DIR/cert.pem"
echo ""
echo "⚠️  Для работы без предупреждений браузера необходимо:"
echo "   1. Добавить сертификат в доверенные в ОС"
echo "   2. Или принять предупреждение в браузере"

# Устанавливаем правильные права
chmod 600 "$CERT_DIR/key.pem"
chmod 644 "$CERT_DIR/cert.pem"

echo "🔒 Права на файлы настроены"
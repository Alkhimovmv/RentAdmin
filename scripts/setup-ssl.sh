#!/bin/bash

# Установка бесплатного SSL сертификата Let's Encrypt
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"
DOMAIN="87.242.103.146"  # Используем IP адрес

echo "🔒 Установка SSL сертификата..."

ssh -t $SERVER_USER@$SERVER_HOST << EOF
    echo "📦 Установка Certbot..."
    sudo apt update
    sudo apt install -y snapd
    sudo snap install core
    sudo snap refresh core
    sudo snap install --classic certbot

    echo "🔗 Создание симлинка..."
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot

    echo "🛑 Остановка nginx для получения сертификата..."
    sudo systemctl stop nginx

    echo "🔑 Получение SSL сертификата для IP адреса..."
    # Для IP адреса создаём самоподписанный сертификат с правильными параметрами
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
        -keyout /etc/nginx/ssl/server.key \\
        -out /etc/nginx/ssl/server.crt \\
        -subj "/C=RU/ST=Moscow/L=Moscow/O=RentAdmin/OU=IT/CN=$DOMAIN" \\
        -addext "subjectAltName=IP:$DOMAIN"

    echo "🔧 Настройка прав доступа..."
    sudo chmod 600 /etc/nginx/ssl/server.key
    sudo chmod 644 /etc/nginx/ssl/server.crt

    echo "▶️ Запуск nginx..."
    sudo systemctl start nginx
    sudo systemctl status nginx --no-pager | head -5

    echo "🧪 Тест HTTPS подключения..."
    curl -k -I https://localhost/api/health | head -5 || echo "HTTPS не работает"
EOF

echo "🎉 SSL сертификат установлен!"
echo "⚠️ Это самоподписанный сертификат, браузеры будут показывать предупреждение"
echo "💡 В браузере нажмите 'Дополнительно' → 'Перейти на сайт (небезопасно)'"
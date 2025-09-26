#!/bin/bash

# Быстрый деплой фронтенда + API на один сервер
# Использует существующий nginx и копирует файлы напрямую

set -e

echo "⚡ Быстрый деплой RentAdmin на 87.242.103.146"
echo "=============================================="
echo ""

# Проверяем наличие nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Устанавливаем nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Останавливаем nginx если запущен
echo "🛑 Останавливаем nginx..."
sudo systemctl stop nginx 2>/dev/null || true

# Создаем директории
echo "📁 Создаем директории..."
sudo mkdir -p /var/www/rentadmin
sudo mkdir -p /etc/nginx/ssl

# Создаем SSL сертификат если его нет
if [ ! -f "/etc/nginx/ssl/cert.pem" ]; then
    echo "🔐 Создаем SSL сертификат..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/key.pem \
        -out /etc/nginx/ssl/cert.pem \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=RentAdmin/OU=Development/CN=87.242.103.146" \
        -addext "subjectAltName=IP:87.242.103.146,IP:127.0.0.1,DNS:localhost"

    echo "✅ SSL сертификат создан"
fi

# Собираем фронтенд
echo "🔨 Собираем фронтенд..."
cd frontend

# Устанавливаем зависимости если их нет
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаем зависимости frontend..."
    npm install
fi

# Собираем проект
npm run build
cd ..

# Копируем файлы фронтенда
echo "📋 Копируем файлы фронтенда..."
sudo rm -rf /var/www/rentadmin/*
sudo cp -r frontend/dist/* /var/www/rentadmin/
sudo chown -R www-data:www-data /var/www/rentadmin

# Создаем конфигурацию nginx
echo "⚙️ Настраиваем nginx..."
sudo tee /etc/nginx/sites-available/rentadmin > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Frontend static files
    location / {
        root /var/www/rentadmin;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy to backend (если запущен на порту 3001)
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;

        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
            add_header Access-Control-Max-Age 1728000 always;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3001/api/health;
    }

    # Info endpoint
    location /info {
        return 200 '{"service":"RentAdmin","frontend":"nginx","backend":"http://127.0.0.1:3001","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}';
        add_header Content-Type 'application/json';
    }
}
EOF

# Активируем конфигурацию
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/rentadmin /etc/nginx/sites-enabled/

# Проверяем конфигурацию nginx
echo "🔍 Проверяем конфигурацию nginx..."
sudo nginx -t

# Запускаем nginx
echo "▶️ Запускаем nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

echo ""
echo "🎉 Деплой завершен!"
echo ""
echo "🌐 ДОСТУП К ПРИЛОЖЕНИЮ:"
echo "Frontend: https://87.242.103.146/"
echo "API: https://87.242.103.146/api/ (проксируется на localhost:3001)"
echo "Info: https://87.242.103.146/info"
echo ""
echo "⚠️ ВАЖНО:"
echo "1. Запустите backend на порту 3001:"
echo "   cd backend && npm run db:migrate && npm start"
echo ""
echo "2. При первом заходе браузер покажет предупреждение SSL"
echo "   Нажмите 'Дополнительно' → 'Перейти на сайт (небезопасно)'"
echo ""
echo "📋 УПРАВЛЕНИЕ:"
echo "Перезапуск nginx: sudo systemctl restart nginx"
echo "Логи nginx: sudo tail -f /var/log/nginx/error.log"
echo "Статус: sudo systemctl status nginx"
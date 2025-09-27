#!/bin/bash

# Простой деплой без sudo - запускаем локальный nginx в user space
# Для быстрого тестирования фронтенда на сервере

set -e

echo "⚡ Простой деплой RentAdmin (без sudo)"
echo "====================================="
echo ""

# Создаем рабочие директории
mkdir -p ~/rentadmin-deploy/www
mkdir -p ~/rentadmin-deploy/ssl
mkdir -p ~/rentadmin-deploy/conf

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
rm -rf ~/rentadmin-deploy/www/*
cp -r frontend/dist/* ~/rentadmin-deploy/www/

# Создаем SSL сертификат
echo "🔐 Создаем SSL сертификат..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ~/rentadmin-deploy/ssl/key.pem \
    -out ~/rentadmin-deploy/ssl/cert.pem \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=RentAdmin/OU=Development/CN=87.242.103.146" \
    -addext "subjectAltName=IP:87.242.103.146,IP:127.0.0.1,DNS:localhost" 2>/dev/null || {

    # Fallback для старых версий openssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ~/rentadmin-deploy/ssl/key.pem \
        -out ~/rentadmin-deploy/ssl/cert.pem \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=RentAdmin/OU=Development/CN=87.242.103.146"
}

# Создаем простую nginx конфигурацию
echo "⚙️ Создаем nginx конфигурацию..."
cat > ~/rentadmin-deploy/conf/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # HTTP to HTTPS redirect
    server {
        listen 8080;
        server_name _;
        return 301 https://$host:8443$request_uri;
    }

    # HTTPS server
    server {
        listen 8443 ssl;
        server_name _;

        ssl_certificate SSL_CERT_PATH/cert.pem;
        ssl_certificate_key SSL_CERT_PATH/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;

        # Frontend static files
        location / {
            root WWW_PATH;
            try_files $uri $uri/ /index.html;

            # CORS headers для всех файлов
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
        }

        # API proxy к backend
        location /api/ {
            proxy_pass http://127.0.0.1:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # CORS headers
            add_header Access-Control-Allow-Origin "*" always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;

            if ($request_method = 'OPTIONS') {
                add_header Access-Control-Allow-Origin "*" always;
                add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
                add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
                return 204;
            }
        }

        # Info endpoint
        location /info {
            return 200 '{"service":"RentAdmin","port":"8443","backend":"http://127.0.0.1:3001"}';
            add_header Content-Type 'application/json';
        }
    }
}
EOF

# Подставляем пути в конфигурацию
sed -i "s|SSL_CERT_PATH|$HOME/rentadmin-deploy/ssl|g" ~/rentadmin-deploy/conf/nginx.conf
sed -i "s|WWW_PATH|$HOME/rentadmin-deploy/www|g" ~/rentadmin-deploy/conf/nginx.conf

echo ""
echo "🎉 Файлы подготовлены!"
echo ""
echo "🚀 ЗАПУСК:"
echo ""
echo "1. Запустите nginx с пользовательской конфигурацией:"
echo "   nginx -c $HOME/rentadmin-deploy/conf/nginx.conf -p $HOME/rentadmin-deploy/"
echo ""
echo "2. Запустите backend в другом терминале:"
echo "   cd backend && npm run db:migrate && npm start"
echo ""
echo "🌐 ДОСТУП:"
echo "Frontend: http://87.242.103.146:8443/"
echo "API: http://87.242.103.146:8443/api/"
echo "Info: http://87.242.103.146:8443/info"
echo ""
echo "⚠️ ВАЖНО:"
echo "- Frontend работает на порту 8443 (HTTPS)"
echo "- Backend должен работать на порту 3001"
echo "- При первом заходе примите SSL сертификат"
echo ""
echo "📋 ОСТАНОВКА:"
echo "nginx -s quit -c $HOME/rentadmin-deploy/conf/nginx.conf -p $HOME/rentadmin-deploy/"
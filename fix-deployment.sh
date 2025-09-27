#!/bin/bash

# Быстрое исправление проблем развертывания
echo "🔧 Исправление проблем развертывания RentAdmin"
echo "==============================================="
echo ""

SERVER_IP="87.242.103.146"

# Остановка сервисов
echo "⏹️ Остановка сервисов..."
sudo systemctl stop rentadmin 2>/dev/null || true
sudo systemctl stop nginx

# Исправление конфликта npm
echo "📦 Исправление конфликта npm..."
sudo apt remove -y npm 2>/dev/null || true
sudo apt install -y npm
sudo npm install -g typescript tsc-alias

# Исправление knexfile для SQLite
echo "🗄️ Исправление конфигурации базы данных..."
sudo tee /opt/rentadmin/backend/knexfile.js > /dev/null << 'EOF'
require('dotenv').config();

const config = {
    development: {
        client: 'sqlite3',
        connection: {
            filename: './dev.sqlite3'
        },
        useNullAsDefault: true,
        migrations: {
            directory: './src/migrations',
        },
        seeds: {
            directory: './src/seeds',
        },
    },
    production: {
        client: 'sqlite3',
        connection: {
            filename: '/opt/rentadmin/backend/production.sqlite3'
        },
        useNullAsDefault: true,
        migrations: {
            directory: './src/migrations',
        },
        seeds: {
            directory: './src/seeds',
        },
    },
};

module.exports = config;
EOF

# Сборка бэкенда
echo "🔨 Сборка бэкенда..."
cd /opt/rentadmin/backend
sudo -u rentadmin npm run build

# Создание базы данных
echo "📊 Создание базы данных..."
sudo -u rentadmin NODE_ENV=production npm run db:migrate

# Сборка фронтенда
echo "🌐 Сборка фронтенда..."
cd /opt/rentadmin/frontend

# Создание .env.production
sudo -u rentadmin tee .env.production > /dev/null << EOF
VITE_API_URL=http://$SERVER_IP/api
NODE_ENV=production
EOF

sudo -u rentadmin npm run build
sudo cp -r dist/* /var/www/html/rentadmin/

# Исправление nginx конфигурации
echo "🌐 Исправление nginx..."
sudo cp /opt/rentadmin/nginx-cloud-http.conf /etc/nginx/nginx.conf

# Проверка nginx
if sudo nginx -t; then
    echo "✅ nginx конфигурация корректна"
else
    echo "❌ Проблема с nginx"
    exit 1
fi

# Создание systemd сервиса
echo "🔧 Создание systemd сервиса..."
sudo tee /etc/systemd/system/rentadmin.service > /dev/null << EOF
[Unit]
Description=RentAdmin Backend
After=network.target

[Service]
Type=simple
User=rentadmin
WorkingDirectory=/opt/rentadmin/backend
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=JWT_SECRET=super-secret-jwt-key-for-rent-admin-production-2024
Environment=PIN_CODE=20031997
Environment=CORS_ORIGIN=*
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/rentadmin/backend.log
StandardError=append:/var/log/rentadmin/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Запуск сервисов
echo "🚀 Запуск сервисов..."
sudo systemctl daemon-reload
sudo systemctl enable rentadmin nginx
sudo systemctl start rentadmin
sudo systemctl start nginx

# Ожидание
echo "⏳ Ожидание запуска..."
sleep 10

# Проверка
echo ""
echo "📊 ПРОВЕРКА СТАТУСА:"
echo "==================="

# Проверка бэкенда
if sudo systemctl is-active --quiet rentadmin; then
    echo "✅ Backend: ЗАПУЩЕН"
else
    echo "❌ Backend: НЕ ЗАПУЩЕН"
    echo "Логи: sudo journalctl -u rentadmin -n 10"
fi

# Проверка nginx
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx: ЗАПУЩЕН"
else
    echo "❌ Nginx: НЕ ЗАПУЩЕН"
    echo "Логи: sudo journalctl -u nginx -n 10"
fi

# Тестирование API
echo ""
echo "🧪 ТЕСТИРОВАНИЕ:"
echo "==============="

# Прямой API
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Прямой API: РАБОТАЕТ"
    curl -s http://localhost:3001/api/health
else
    echo "❌ Прямой API: НЕ РАБОТАЕТ"
fi

echo ""

# API через nginx
if curl -s http://localhost/api/health > /dev/null; then
    echo "✅ API через nginx: РАБОТАЕТ"
    curl -s http://localhost/api/health
else
    echo "❌ API через nginx: НЕ РАБОТАЕТ"
fi

echo ""

# Фронтенд
if curl -s http://localhost/ | head -5 | grep -q "html"; then
    echo "✅ Фронтенд: РАБОТАЕТ"
else
    echo "❌ Фронтенд: НЕ РАБОТАЕТ"
fi

echo ""
echo "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo ""
echo "🌍 Доступ к приложению:"
echo "📱 Веб-интерфейс: http://$SERVER_IP/"
echo "🎯 API: http://$SERVER_IP/api"
echo "🏥 Health: http://$SERVER_IP/health"
echo ""
echo "🔧 Диагностика:"
echo "sudo systemctl status rentadmin nginx"
echo "sudo journalctl -u rentadmin -f"
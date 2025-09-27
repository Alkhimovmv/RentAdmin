#!/bin/bash

# Развертывание RentAdmin на cloud.ru сервере с HTTP доступом
echo "☁️ Развертывание RentAdmin на cloud.ru"
echo "======================================"
echo ""

# Проверяем что мы root или можем sudo
if [[ $EUID -ne 0 && ! $(sudo -n true 2>/dev/null) ]]; then
    echo "❌ Нужны права sudo для установки системных пакетов"
    echo "Запустите: sudo ./deploy-cloud-http.sh"
    exit 1
fi

# Получаем IP сервера
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "UNKNOWN")
fi

echo "🌐 IP сервера: $SERVER_IP"
echo ""

# Функция для выполнения команд с sudo если нужно
run_cmd() {
    if [[ $EUID -eq 0 ]]; then
        "$@"
    else
        sudo "$@"
    fi
}

# Обновляем систему
echo "📦 Обновление системных пакетов..."
run_cmd apt update
run_cmd apt upgrade -y

# Устанавливаем необходимые пакеты
echo "🔧 Установка необходимых пакетов..."
run_cmd apt install -y nginx nodejs npm sqlite3 curl git ufw

# Настраиваем файрвол
echo "🔥 Настройка файрвола..."
run_cmd ufw allow 22/tcp
run_cmd ufw allow 80/tcp
run_cmd ufw allow 3001/tcp
run_cmd ufw --force enable

# Устанавливаем современную версию Node.js
echo "📋 Проверка версии Node.js..."
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
    echo "🔄 Установка Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | run_cmd bash -
    run_cmd apt install -y nodejs
fi

echo "✅ Node.js версия: $(node -v)"
echo "✅ npm версия: $(npm -v)"

# Создаем пользователя для приложения
if ! id "rentadmin" &>/dev/null; then
    echo "👤 Создание пользователя rentadmin..."
    run_cmd useradd -m -s /bin/bash rentadmin
    run_cmd usermod -aG sudo rentadmin
fi

# Создаем директории
echo "📁 Создание директорий..."
run_cmd mkdir -p /var/www/html/rentadmin
run_cmd mkdir -p /opt/rentadmin
run_cmd mkdir -p /var/log/rentadmin

# Копируем проект
echo "📋 Копирование файлов проекта..."
run_cmd cp -r . /opt/rentadmin/
run_cmd chown -R rentadmin:rentadmin /opt/rentadmin
run_cmd chown -R rentadmin:rentadmin /var/www/html/rentadmin
run_cmd chown -R rentadmin:rentadmin /var/log/rentadmin

# Переходим в директорию проекта
cd /opt/rentadmin

# Настраиваем бэкенд
echo "🎯 Настройка бэкенда..."
cd backend

# Устанавливаем зависимости
echo "📦 Установка зависимостей бэкенда..."
sudo -u rentadmin npm install --production

# Создаем production конфигурацию для SQLite
sudo -u rentadmin tee knexfile.production.js > /dev/null << 'EOF'
const config = {
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

# Собираем бэкенд
echo "🔨 Сборка бэкенда..."
sudo -u rentadmin npm run build

# Запускаем миграции
echo "📊 Настройка базы данных..."
sudo -u rentadmin NODE_ENV=production npm run db:migrate

# Настраиваем фронтенд
cd ../frontend

echo "🌐 Настройка фронтенда..."

# Создаем production конфигурацию API
sudo -u rentadmin tee .env.production > /dev/null << EOF
VITE_API_URL=http://$SERVER_IP/api
NODE_ENV=production
EOF

# Устанавливаем зависимости
echo "📦 Установка зависимостей фронтенда..."
sudo -u rentadmin npm install

# Собираем фронтенд для production
echo "🔨 Сборка фронтенда..."
sudo -u rentadmin npm run build

# Копируем собранный фронтенд в nginx
echo "📋 Копирование фронтенда в nginx..."
run_cmd cp -r dist/* /var/www/html/rentadmin/

# Настраиваем nginx
echo "🌐 Настройка nginx..."
cd /opt/rentadmin

# Копируем конфигурацию nginx
run_cmd cp nginx-cloud-http.conf /etc/nginx/nginx.conf

# Проверяем конфигурацию nginx
if run_cmd nginx -t; then
    echo "✅ Конфигурация nginx корректна"
else
    echo "❌ Ошибка в конфигурации nginx"
    exit 1
fi

# Создаем systemd сервис для бэкенда
echo "🔧 Создание systemd сервиса..."
run_cmd tee /etc/systemd/system/rentadmin.service > /dev/null << EOF
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

# Перезагружаем systemd и запускаем сервисы
echo "🚀 Запуск сервисов..."
run_cmd systemctl daemon-reload
run_cmd systemctl enable rentadmin
run_cmd systemctl start rentadmin
run_cmd systemctl enable nginx
run_cmd systemctl restart nginx

# Ждем запуска
echo "⏳ Ожидание запуска сервисов..."
sleep 5

# Проверяем статус
echo ""
echo "📊 СТАТУС СЕРВИСОВ:"
echo "=================="

# Проверяем бэкенд
if systemctl is-active --quiet rentadmin; then
    echo "✅ Backend: РАБОТАЕТ"
else
    echo "❌ Backend: НЕ РАБОТАЕТ"
    echo "Логи: journalctl -u rentadmin -n 20"
fi

# Проверяем nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: РАБОТАЕТ"
else
    echo "❌ Nginx: НЕ РАБОТАЕТ"
    echo "Логи: journalctl -u nginx -n 20"
fi

# Проверяем доступность API
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ API: ДОСТУПЕН"
else
    echo "❌ API: НЕДОСТУПЕН"
fi

# Проверяем доступность фронтенда
if curl -s http://localhost/ > /dev/null; then
    echo "✅ Frontend: ДОСТУПЕН"
else
    echo "❌ Frontend: НЕДОСТУПЕН"
fi

echo ""
echo "🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo "=========================="
echo ""
echo "🌍 ДОСТУП К ПРИЛОЖЕНИЮ:"
echo "📱 Веб-интерфейс: http://$SERVER_IP/"
echo "🎯 API: http://$SERVER_IP/api"
echo "🏥 Health check: http://$SERVER_IP/health"
echo ""
echo "🔧 УПРАВЛЕНИЕ:"
echo "📊 Статус бэкенда: systemctl status rentadmin"
echo "📊 Статус nginx: systemctl status nginx"
echo "📋 Логи бэкенда: tail -f /var/log/rentadmin/backend.log"
echo "📋 Логи nginx: tail -f /var/log/nginx/access.log"
echo "🔄 Перезапуск бэкенда: systemctl restart rentadmin"
echo "🔄 Перезапуск nginx: systemctl restart nginx"
echo ""
echo "🔒 БЕЗОПАСНОСТЬ:"
echo "🔥 Файрвол: ufw status"
echo "🔧 Открыты порты: 22 (SSH), 80 (HTTP)"
echo ""
echo "💡 ТЕСТИРОВАНИЕ:"
echo "curl http://$SERVER_IP/health"
echo "curl http://$SERVER_IP/api/health"
echo ""
echo "🎊 Готово! Откройте http://$SERVER_IP/ в браузере"
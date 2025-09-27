#!/bin/bash

# Исправленное развертывание RentAdmin на cloud.ru сервере с HTTP доступом
echo "☁️ Развертывание RentAdmin на cloud.ru (исправленная версия)"
echo "=========================================================="
echo ""

# Проверяем что мы root или можем sudo
if [[ $EUID -ne 0 && ! $(sudo -n true 2>/dev/null) ]]; then
    echo "❌ Нужны права sudo для установки системных пакетов"
    echo "Запустите: sudo ./deploy-cloud-http-fixed.sh"
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

# Устанавливаем необходимые пакеты (решаем проблему с npm)
echo "🔧 Установка необходимых пакетов..."
run_cmd apt install -y nginx sqlite3 curl git ufw

# Устанавливаем npm отдельно (решение конфликта)
echo "📦 Установка npm..."
run_cmd apt remove -y npm 2>/dev/null || true
run_cmd apt install -y npm

# Глобальная установка TypeScript
echo "🔧 Установка TypeScript глобально..."
run_cmd npm install -g typescript tsc-alias

# Настраиваем файрвол
echo "🔥 Настройка файрвола..."
run_cmd ufw allow 22/tcp
run_cmd ufw allow 80/tcp
run_cmd ufw --force enable

echo "✅ Node.js версия: $(node -v)"
echo "✅ npm версия: $(npm -v)"
echo "✅ TypeScript версия: $(tsc -v)"

# Создаем пользователя для приложения
if ! id "rentadmin" &>/dev/null; then
    echo "👤 Создание пользователя rentadmin..."
    run_cmd useradd -m -s /bin/bash rentadmin
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
sudo -u rentadmin npm install

# Создаем правильную production конфигурацию для SQLite
echo "🗄️ Настройка базы данных..."
sudo -u rentadmin tee knexfile.js > /dev/null << 'EOF'
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

# Собираем бэкенд
echo "🔨 Сборка бэкенда..."
sudo -u rentadmin npm run build

# Запускаем миграции для production
echo "📊 Настройка базы данных..."
sudo -u rentadmin NODE_ENV=production npm run db:migrate

# Настраиваем фронтенд
cd ../frontend

echo "🌐 Настройка фронтенда..."

# Проверяем существование package.json и скриптов
if [ ! -f "package.json" ]; then
    echo "❌ package.json не найден во фронтенде"
    exit 1
fi

# Создаем production конфигурацию API
sudo -u rentadmin tee .env.production > /dev/null << EOF
VITE_API_URL=http://$SERVER_IP/api
NODE_ENV=production
EOF

# Устанавливаем зависимости
echo "📦 Установка зависимостей фронтенда..."
sudo -u rentadmin npm install

# Проверяем наличие build скрипта
if npm run | grep -q "build"; then
    echo "🔨 Сборка фронтенда..."
    sudo -u rentadmin npm run build

    # Проверяем что сборка прошла успешно
    if [ -d "dist" ]; then
        echo "✅ Фронтенд собран успешно"
        # Копируем собранный фронтенд в nginx
        echo "📋 Копирование фронтенда в nginx..."
        run_cmd cp -r dist/* /var/www/html/rentadmin/
    else
        echo "❌ Сборка фронтенда не создала директорию dist"
        exit 1
    fi
else
    echo "❌ Build скрипт не найден в package.json"
    echo "Доступные скрипты:"
    sudo -u rentadmin npm run
    exit 1
fi

# Настраиваем nginx
echo "🌐 Настройка nginx..."
cd /opt/rentadmin

# Создаем резервную копию оригинальной конфигурации
run_cmd cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Копируем нашу конфигурацию nginx
run_cmd cp nginx-cloud-http.conf /etc/nginx/nginx.conf

# Проверяем конфигурацию nginx
echo "🔍 Проверка конфигурации nginx..."
if run_cmd nginx -t; then
    echo "✅ Конфигурация nginx корректна"
else
    echo "❌ Ошибка в конфигурации nginx, восстанавливаем оригинальную"
    run_cmd cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
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
sleep 10

# Проверяем статус
echo ""
echo "📊 СТАТУС СЕРВИСОВ:"
echo "=================="

# Проверяем бэкенд
if systemctl is-active --quiet rentadmin; then
    echo "✅ Backend: РАБОТАЕТ"

    # Проверяем API
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo "✅ API: ДОСТУПЕН"
    else
        echo "⚠️ API: НЕ ОТВЕЧАЕТ"
    fi
else
    echo "❌ Backend: НЕ РАБОТАЕТ"
    echo "Логи: journalctl -u rentadmin -n 20"
fi

# Проверяем nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: РАБОТАЕТ"

    # Проверяем фронтенд
    if curl -s http://localhost/ > /dev/null; then
        echo "✅ Frontend: ДОСТУПЕН"
    else
        echo "⚠️ Frontend: НЕ ОТВЕЧАЕТ"
    fi
else
    echo "❌ Nginx: НЕ РАБОТАЕТ"
    echo "Логи: journalctl -u nginx -n 20"
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
echo "🔧 ДИАГНОСТИКА:"
echo "📊 Статус: systemctl status rentadmin nginx"
echo "📋 Логи бэкенда: journalctl -u rentadmin -f"
echo "📋 Логи nginx: tail -f /var/log/nginx/error.log"
echo "🧪 Тест API: curl http://$SERVER_IP/api/health"
echo "🧪 Тест фронтенда: curl -I http://$SERVER_IP/"
echo ""

# Финальная проверка
echo "🔍 ФИНАЛЬНАЯ ПРОВЕРКА:"
echo "====================="

# Тестируем endpoints
echo "Тестирование API..."
API_RESPONSE=$(curl -s http://localhost:3001/api/health 2>/dev/null)
if [ ! -z "$API_RESPONSE" ]; then
    echo "✅ Прямой API работает: $API_RESPONSE"
else
    echo "❌ Прямой API не отвечает"
fi

echo "Тестирование прокси..."
PROXY_RESPONSE=$(curl -s http://localhost/api/health 2>/dev/null)
if [ ! -z "$PROXY_RESPONSE" ]; then
    echo "✅ Прокси API работает: $PROXY_RESPONSE"
else
    echo "❌ Прокси API не отвечает"
fi

echo ""
echo "🎊 Готово! Откройте http://$SERVER_IP/ в браузере"
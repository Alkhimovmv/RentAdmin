#!/bin/bash

# Локальный запуск RentAdmin для доступа с любых устройств в сети

echo "🏠 Запуск RentAdmin - Локальный сервер"
echo "====================================="
echo ""

# Получаем локальный IP
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "📍 Ваш локальный IP: $LOCAL_IP"

# Останавливаем старые процессы
echo "🛑 Остановка старых процессов..."
pkill -f local-server 2>/dev/null || true
pkill -f simple-frontend 2>/dev/null || true
lsof -ti:3000 | xargs -r kill 2>/dev/null || true

# Подготавливаем фронтенд если нужно
if [ ! -d "$HOME/rentadmin-deploy/www" ]; then
    echo "📋 Подготовка фронтенда..."
    ./scripts/simple-deploy.sh > /dev/null 2>&1
    echo "✅ Фронтенд подготовлен"
fi

# Запускаем локальный сервер
echo "🚀 Запуск локального сервера..."
nohup node local-server.js > local-server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > local-server.pid

# Ждем запуска
sleep 3

# Проверяем запуск
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Сервер запущен успешно!"
else
    echo "❌ Ошибка запуска сервера"
    echo "Проверьте логи: tail -f local-server.log"
    exit 1
fi

echo ""
echo "🎉 RentAdmin доступен в локальной сети!"
echo ""
echo "🌐 ДОСТУП К СЕРВЕРУ:"
echo "📍 С этого компьютера:  http://localhost:3000/"
echo "📍 Из локальной сети:   http://$LOCAL_IP:3000/"
echo "📱 С телефона:          http://$LOCAL_IP:3000/"
echo ""
echo "📋 ИНФОРМАЦИЯ:"
echo "ℹ️  Статус сервера:      http://$LOCAL_IP:3000/info"
echo "❤️  Проверка здоровья:   http://$LOCAL_IP:3000/health"
echo "🧪 Демо API:             http://$LOCAL_IP:3000/api/demo"
echo ""
echo "📱 ДЛЯ ПОДКЛЮЧЕНИЯ С ДРУГИХ УСТРОЙСТВ:"
echo "1️⃣  Подключите устройство к той же WiFi сети"
echo "2️⃣  Откройте браузер на устройстве"
echo "3️⃣  Перейдите по адресу: http://$LOCAL_IP:3000/"
echo ""
echo "💡 ДОПОЛНИТЕЛЬНО:"
echo "🔧 Запуск backend:       cd backend && npm start"
echo "📋 Логи:                 tail -f local-server.log"
echo "⏹️ Остановка:            kill \$(cat local-server.pid)"
echo ""
echo "🔥 Сервер готов к использованию!"

# Показываем QR код для мобильных устройств (если есть qrencode)
if command -v qrencode &> /dev/null; then
    echo ""
    echo "📱 QR код для быстрого доступа с телефона:"
    echo "http://$LOCAL_IP:3000/" | qrencode -t UTF8
fi
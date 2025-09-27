#!/bin/bash

# Запуск RentAdmin с удаленным доступом через ngrok

echo "🌍 Запуск RentAdmin с удаленным доступом"
echo "======================================"
echo ""

# Проверяем что локальный сервер запущен
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "⚠️ Локальный сервер не запущен. Запускаю..."
    ./local-start.sh
    sleep 5
fi

# Проверяем ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok не установлен"
    echo "Запустите: ./remote-access.sh и выберите вариант 1"
    exit 1
fi

# Проверяем токен ngrok
if ! ngrok config check > /dev/null 2>&1; then
    echo "❌ ngrok не настроен"
    echo ""
    echo "🔑 НАСТРОЙКА:"
    echo "1. Зайдите на https://ngrok.com/"
    echo "2. Получите authtoken"
    echo "3. Выполните: ngrok config add-authtoken ВАШ_ТОКЕН"
    exit 1
fi

# Останавливаем старые туннели
pkill -f ngrok 2>/dev/null || true

echo "🚀 Запуск ngrok туннеля..."

# Запускаем ngrok в фоне
nohup ngrok http 3000 > ngrok.log 2>&1 &
NGROK_PID=$!
echo $NGROK_PID > ngrok.pid

echo "⏳ Ждем запуска туннеля..."
sleep 5

# Получаем публичный URL
PUBLIC_URL=""
for i in {1..10}; do
    PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)
    if [ ! -z "$PUBLIC_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$PUBLIC_URL" ]; then
    echo "❌ Не удалось получить публичный URL"
    echo "Проверьте логи: tail -f ngrok.log"
    exit 1
fi

echo ""
echo "🎉 RentAdmin доступен из любой точки мира!"
echo ""
echo "🌍 ПУБЛИЧНЫЙ ДОСТУП:"
echo "🔗 URL: $PUBLIC_URL"
echo "📱 С телефона: $PUBLIC_URL"
echo "💻 С любого компьютера: $PUBLIC_URL"
echo ""
echo "📋 ЛОКАЛЬНЫЙ ДОСТУП (как раньше):"
echo "🏠 Локально: http://localhost:3000/"
echo "📶 В сети: http://$(hostname -I | awk '{print $1}'):3000/"
echo ""
echo "🔧 УПРАВЛЕНИЕ:"
echo "📊 ngrok панель: http://localhost:4040/"
echo "📋 Логи ngrok: tail -f ngrok.log"
echo "⏹️ Остановка: kill \$(cat ngrok.pid)"
echo "🔄 Перезапуск: ./start-remote.sh"
echo ""
echo "💡 ВАЖНО:"
echo "⚠️ При первом заходе ngrok покажет предупреждение"
echo "   Нажмите 'Visit Site' для продолжения"
echo ""
echo "🔒 БЕЗОПАСНОСТЬ:"
echo "- URL действует только пока запущен туннель"
echo "- Для продакшена используйте Cloudflare Tunnel"
echo ""
echo "🎊 Поделитесь URL с кем угодно для доступа к приложению!"

# Показываем QR код если есть qrencode
if command -v qrencode &> /dev/null; then
    echo ""
    echo "📱 QR код для быстрого доступа:"
    echo "$PUBLIC_URL" | qrencode -t UTF8
fi
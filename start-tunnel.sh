#!/bin/bash

# Запуск RentAdmin с удаленным доступом через localtunnel (без регистрации)

echo "🌍 Запуск RentAdmin с публичным доступом (localtunnel)"
echo "=================================================="
echo ""

# Проверяем что локальный сервер запущен
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "⚠️ Локальный сервер не запущен. Запускаю..."
    ./local-start.sh
    sleep 5

    # Проверяем еще раз
    if ! curl -s http://localhost:3000/health > /dev/null; then
        echo "❌ Не удалось запустить локальный сервер"
        echo "Попробуйте вручную: ./local-start.sh"
        exit 1
    fi
fi

echo "✅ Локальный сервер работает"

# Проверяем localtunnel
if [ ! -f "node_modules/.bin/lt" ]; then
    echo "📦 Устанавливаю localtunnel..."
    npm install localtunnel
fi

# Останавливаем старые туннели
pkill -f "node.*localtunnel" 2>/dev/null || true
pkill -f "lt " 2>/dev/null || true

echo "🚀 Запускаю публичный туннель..."
echo "⏳ Это может занять 10-20 секунд..."

# Запускаем localtunnel в фоне
nohup ./node_modules/.bin/lt --port 3000 > tunnel.log 2>&1 &
TUNNEL_PID=$!
echo $TUNNEL_PID > tunnel.pid

# Ждем появления URL в логах
echo "⏳ Ждем получения публичного URL..."
PUBLIC_URL=""

for i in {1..30}; do
    if [ -f tunnel.log ]; then
        # Ищем URL в логах
        PUBLIC_URL=$(grep -o 'https://.*\.loca\.lt' tunnel.log 2>/dev/null | head -1)
        if [ ! -z "$PUBLIC_URL" ]; then
            break
        fi
    fi
    sleep 1
    echo -n "."
done

echo ""

if [ -z "$PUBLIC_URL" ]; then
    echo "❌ Не удалось получить публичный URL"
    echo "Проверьте логи: tail -f tunnel.log"
    echo "Возможно, проблема с интернет-соединением"
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
echo "📋 Логи туннеля: tail -f tunnel.log"
echo "⏹️ Остановка: kill \$(cat tunnel.pid)"
echo "🔄 Перезапуск: ./start-tunnel.sh"
echo ""
echo "💡 ВАЖНО:"
echo "⚠️ При первом заходе может появиться страница localtunnel"
echo "   Нажмите 'Click to Continue' для продолжения"
echo "⚠️ URL действует только пока запущен туннель"
echo "⚠️ Для постоянного доступа используйте Cloudflare Tunnel"
echo ""
echo "🎊 Поделитесь URL с кем угодно для доступа к приложению!"

# Показываем QR код если есть qrencode
if command -v qrencode &> /dev/null; then
    echo ""
    echo "📱 QR код для быстрого доступа:"
    echo "$PUBLIC_URL" | qrencode -t UTF8
fi

echo ""
echo "🔍 Проверка доступности..."
sleep 3

# Проверяем доступность
if curl -s --max-time 10 "$PUBLIC_URL/health" > /dev/null; then
    echo "✅ Туннель работает корректно!"
else
    echo "⚠️ Туннель создан, но может быть временно недоступен"
    echo "Попробуйте открыть $PUBLIC_URL в браузере"
fi
#!/bin/bash

# Быстрый запуск RentAdmin на HTTP (для тестирования)

echo "🚀 Быстрый запуск RentAdmin"
echo "=========================="
echo ""

# Остановка старых процессов
echo "🛑 Остановка старых процессов..."
pkill -f simple-frontend 2>/dev/null || true
pkill -f serve-frontend 2>/dev/null || true
lsof -ti:8080 | xargs -r kill 2>/dev/null || true

# Подготовка фронтенда
echo "📋 Подготовка фронтенда..."
if [ ! -d "$HOME/rentadmin-deploy/www" ]; then
    ./scripts/simple-deploy.sh > /dev/null 2>&1
    echo "✅ Фронтенд подготовлен"
else
    echo "✅ Фронтенд уже подготовлен"
fi

# Запуск простого HTTP сервера
echo "🌐 Запуск HTTP сервера..."
nohup node simple-frontend.js > frontend-simple.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > frontend-simple.pid

# Ждем запуска
sleep 3

# Проверка запуска
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Frontend сервер запущен успешно"
else
    echo "❌ Ошибка запуска frontend сервера"
    echo "Проверьте логи: tail -f frontend-simple.log"
    exit 1
fi

echo ""
echo "🎉 RentAdmin Frontend запущен!"
echo ""
echo "🌐 ДОСТУП К ПРИЛОЖЕНИЮ:"
echo "Frontend: http://87.242.103.146:8080/"
echo "Health: http://87.242.103.146:8080/health"
echo "Info: http://87.242.103.146:8080/info"
echo ""
echo "📋 УПРАВЛЕНИЕ:"
echo "Логи: tail -f frontend-simple.log"
echo "Остановка: kill \$(cat frontend-simple.pid)"
echo ""
echo "⚡ СЛЕДУЮЩИЕ ШАГИ:"
echo "1. Откройте http://87.242.103.146:8080/ в браузере"
echo "2. Если нужен backend, запустите в другом терминале:"
echo "   cd backend && npm install && npm run db:migrate && npm start"
echo ""
echo "🔧 АЛЬТЕРНАТИВА С HTTPS:"
echo "Если нужен HTTPS, используйте: ./scripts/quick-deploy.sh (требует sudo)"
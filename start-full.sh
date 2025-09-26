#!/bin/bash

# Полный запуск RentAdmin (Frontend + Backend)
# Фронтенд на порту 8443, Backend на порту 3001

echo "🚀 Запуск RentAdmin Full Stack"
echo "=============================="
echo ""

# Подготавливаем фронтенд
echo "📋 Подготовка фронтенда..."
./scripts/simple-deploy.sh > /dev/null

echo "✅ Фронтенд подготовлен"
echo ""

# Запускаем фронтенд сервер в фоне
echo "🌐 Запуск frontend сервера..."
nohup node serve-frontend.js > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Ждем запуска фронтенда
sleep 3

# Запускаем backend в фоне
echo "🔌 Запуск backend сервера..."
cd backend

# Проверяем наличие node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаем зависимости backend..."
    npm install > /dev/null
fi

# Запускаем backend
nohup npm run db:migrate > ../backend.log 2>&1 && nohup npm start >> ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

cd ..

# Сохраняем PID процессов
echo $FRONTEND_PID > frontend.pid
echo $BACKEND_PID > backend.pid

echo ""
echo "⏳ Ждем запуска сервисов..."
sleep 10

echo ""
echo "🎉 RentAdmin запущен!"
echo ""
echo "🌐 ДОСТУП К ПРИЛОЖЕНИЮ:"
echo "Frontend: https://87.242.103.146:8443/"
echo "API: https://87.242.103.146:8443/api/"
echo "Info: https://87.242.103.146:8443/info"
echo ""
echo "📋 ЛОГИ:"
echo "Frontend: tail -f frontend.log"
echo "Backend: tail -f backend.log"
echo ""
echo "⏹️ ОСТАНОВКА:"
echo "./stop-full.sh"
echo ""
echo "🔍 ПРОВЕРКА СТАТУСА:"
echo "ps aux | grep -E '(serve-frontend|node.*backend)'"
echo ""
echo "⚠️ При первом заходе в браузере нажмите:"
echo "\"Дополнительно\" → \"Перейти на сайт (небезопасно)\""
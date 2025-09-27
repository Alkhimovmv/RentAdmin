#!/bin/bash

# Запуск полного стека RentAdmin локально
echo "🚀 Запуск полного стека RentAdmin (локально)"
echo "==========================================="
echo ""

# Остановка предыдущих процессов
echo "🛑 Остановка предыдущих процессов..."
pkill -f "npm start" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node dist/server.js" 2>/dev/null || true
sleep 2

# Переход в бэкенд
cd backend

echo "🗄️ Проверка базы данных..."
if [ ! -f "dev.sqlite3" ]; then
    echo "📦 Создание базы данных..."
    npm run db:migrate
fi

echo "🎯 Запуск бэкенда на порту 3001..."
NODE_ENV=development PORT=3001 JWT_SECRET=super-secret-jwt-key-for-rent-admin-2024 PIN_CODE=20031997 CORS_ORIGIN="*" npm start &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid

# Ждем запуска бэкенда
echo "⏳ Ожидание запуска бэкенда..."
sleep 3

# Проверяем бэкенд
for i in {1..10}; do
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo "✅ Бэкенд готов: http://localhost:3001/api"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Бэкенд не запустился"
        exit 1
    fi
    sleep 2
    echo -n "."
done

# Переход во фронтенд
cd ../frontend

echo ""
echo "🌐 Запуск фронтенда..."
VITE_API_URL=http://localhost:3001/api npm run dev &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid

# Ждем запуска фронтенда
echo "⏳ Ожидание запуска фронтенда..."
sleep 5

# Проверяем фронтенд
FRONTEND_PORT=""
for i in {1..10}; do
    # Ищем порт в логах Vite
    if curl -s http://localhost:5173/ > /dev/null 2>&1; then
        FRONTEND_PORT="5173"
        break
    elif curl -s http://localhost:5174/ > /dev/null 2>&1; then
        FRONTEND_PORT="5174"
        break
    elif curl -s http://localhost:5175/ > /dev/null 2>&1; then
        FRONTEND_PORT="5175"
        break
    fi

    if [ $i -eq 10 ]; then
        echo "❌ Фронтенд не запустился"
        exit 1
    fi
    sleep 2
    echo -n "."
done

echo ""
echo ""
echo "🎉 ПОЛНЫЙ СТЕК ЗАПУЩЕН!"
echo ""
echo "📋 ДОСТУПНЫЕ АДРЕСА:"
echo "🎯 Backend API:  http://localhost:3001/api"
echo "🌐 Frontend App: http://localhost:${FRONTEND_PORT}/"
echo ""
echo "🔧 УПРАВЛЕНИЕ:"
echo "⏹️ Остановка: killall npm"
echo "📊 Логи бэкенда: tail -f backend/logs/app.log"
echo "🔄 Перезапуск: ./start-local-stack.sh"
echo ""
echo "🚀 Откройте http://localhost:${FRONTEND_PORT}/ в браузере!"

# Переходим в корневую директорию
cd ..

# Показываем статус
echo ""
echo "📈 СТАТУС СЕРВИСОВ:"
echo "Backend PID: $BACKEND_PID (порт 3001)"
echo "Frontend PID: $FRONTEND_PID (порт ${FRONTEND_PORT})"
echo ""
echo "💡 Теперь фронтенд подключается к локальному бэкенду!"
echo "   Больше никаких ошибок с 87.242.103.146!"
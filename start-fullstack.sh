#!/bin/bash

echo "🚀 Запуск полного стека RentAdmin"
echo "================================="

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Запустите скрипт из корневой директории RentAdmin"
    exit 1
fi

# Функция для остановки всех процессов при выходе
cleanup() {
    echo ""
    echo "🛑 Остановка всех сервисов..."

    # Останавливаем фоновые процессы
    for pid in ${PIDS[@]}; do
        if kill -0 $pid 2>/dev/null; then
            echo "Остановка процесса $pid"
            kill -TERM $pid 2>/dev/null
        fi
    done

    # Ждем немного и принудительно убиваем если нужно
    sleep 2
    for pid in ${PIDS[@]}; do
        if kill -0 $pid 2>/dev/null; then
            echo "Принудительная остановка $pid"
            kill -KILL $pid 2>/dev/null
        fi
    done

    echo "✅ Все сервисы остановлены"
    exit 0
}

# Устанавливаем обработчик сигналов
trap cleanup SIGINT SIGTERM EXIT

# Массив для хранения PID процессов
PIDS=()

echo ""
echo "📦 Установка зависимостей..."

# Устанавливаем зависимости бэкенда
echo "🔧 Backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

# Проверяем и создаем базу данных
echo "🗄️ Настройка базы данных..."
if [ ! -f "dev.sqlite3" ]; then
    echo "Создание базы данных..."
    npx knex migrate:latest
    echo "База данных создана"
else
    echo "База данных уже существует"
fi

# Собираем бэкенд
echo "🔨 Сборка backend..."
npm run build

cd ..

# Устанавливаем зависимости фронтенда
echo "🔧 Frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi

cd ..

echo ""
echo "🚀 Запуск сервисов..."

# Запускаем бэкенд
echo "🟢 Запуск Backend на порту 3001..."
cd backend
NODE_ENV=development PORT=3001 JWT_SECRET=super-secret-jwt-key-for-rent-admin-2024 PIN_CODE=20031997 CORS_ORIGIN="*" npm start &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)

cd ..

# Ждем запуска бэкенда
echo "⏳ Ожидание запуска backend..."
sleep 5

# Проверяем что бэкенд запустился
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Backend не запустился, проверьте логи"
    cleanup
fi

echo "✅ Backend запущен и работает"

# Запускаем фронтенд
echo "🟦 Запуск Frontend на порту 5173..."
cd frontend
VITE_API_URL=http://localhost:3001/api npm run dev &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)

cd ..

echo ""
echo "🎉 Все сервисы запущены!"
echo "========================"
echo ""
echo "📍 Доступные URL:"
echo "🌐 Frontend:  http://localhost:5173"
echo "🔌 Backend:   http://localhost:3001"
echo "🏥 Health:    http://localhost:3001/api/health"
echo ""
echo "💡 Логи процессов отображаются ниже"
echo "🛑 Нажмите Ctrl+C для остановки всех сервисов"
echo ""

# Ждем завершения всех процессов
wait
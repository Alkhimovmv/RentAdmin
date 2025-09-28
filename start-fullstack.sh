#!/bin/bash

echo "🚀 Запуск RentAdmin"
echo "=================="

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Массив для хранения PID процессов
PIDS=()

# Функция для завершения всех процессов при выходе
cleanup() {
    echo -e "\n${RED}🛑 Остановка сервисов...${NC}"
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "Остановка процесса $pid"
            kill "$pid" 2>/dev/null
        fi
    done
    exit 0
}

# Устанавливаем обработчик сигналов
trap cleanup SIGINT SIGTERM

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js не установлен${NC}"
    exit 1
fi

# Проверяем наличие npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm не установлен${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Установка зависимостей...${NC}"

# Устанавливаем зависимости backend
if [ ! -d "backend/node_modules" ]; then
    echo "Установка зависимостей backend..."
    cd backend && npm install
    cd ..
fi

# Устанавливаем зависимости frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "Установка зависимостей frontend..."
    cd frontend && npm install
    cd ..
fi

# Собираем backend
echo -e "${BLUE}🔨 Сборка backend...${NC}"
cd backend && npm run build
cd ..

# Запускаем backend
echo -e "${GREEN}🟢 Запуск Backend на порту 3001...${NC}"
cd backend
NODE_ENV=development PORT=3001 JWT_SECRET=super-secret-jwt-key-for-rent-admin-2024 PIN_CODE=20031997 CORS_ORIGIN="*" npm start &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)
cd ..

# Ждем запуска backend
echo "Ожидание запуска backend..."
sleep 5

# Запускаем frontend
echo -e "${GREEN}🟡 Запуск Frontend на порту 5174...${NC}"
cd frontend
VITE_API_URL=http://localhost:3001/api PORT=5174 npm run dev &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
cd ..

echo ""
echo -e "${GREEN}✅ Сервисы запущены!${NC}"
echo "📍 Frontend: http://localhost:5174"
echo "📍 Backend API: http://localhost:3001/api"
echo "📍 Health check: http://localhost:3001/api/health"
echo ""
echo "Нажмите Ctrl+C для остановки"

# Ждем завершения процессов
wait
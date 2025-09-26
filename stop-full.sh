#!/bin/bash

# Остановка RentAdmin (Frontend + Backend)

echo "⏹️ Остановка RentAdmin..."

# Остановка по PID файлам
if [ -f "frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend.pid)
    echo "Остановка frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null && echo "✅ Frontend остановлен"
    rm -f frontend.pid
fi

if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    echo "Остановка backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null && echo "✅ Backend остановлен"
    rm -f backend.pid
fi

# Дополнительная очистка по портам
echo "🧹 Дополнительная очистка..."
lsof -ti:8443 | xargs -r kill 2>/dev/null
lsof -ti:3001 | xargs -r kill 2>/dev/null

# Очистка процессов по имени
pkill -f "serve-frontend.js" 2>/dev/null
pkill -f "backend.*node" 2>/dev/null

echo "✅ Все процессы остановлены"
echo ""
echo "📋 ЛОГИ (сохранены):"
echo "Frontend: frontend.log"
echo "Backend: backend.log"
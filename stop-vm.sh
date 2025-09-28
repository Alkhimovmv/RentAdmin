#!/bin/bash

# Скрипт для остановки RentAdmin на виртуальной машине

echo "🛑 Остановка RentAdmin..."

# Остановка nginx контейнера
echo "📦 Остановка nginx..."
docker-compose -f docker-compose.host.yml down

# Остановка backend процесса
echo "⚙️  Остановка backend..."
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ Backend процесс остановлен (PID: $BACKEND_PID)"
    else
        echo "⚠️  Backend процесс уже не активен"
    fi
    rm backend.pid
else
    # Альтернативный способ остановки
    pkill -f "node.*dist/server.js"
    echo "✅ Backend процессы остановлены"
fi

echo ""
echo "✅ RentAdmin остановлен"
#!/bin/bash

echo "🛑 Остановка всех сервисов RentAdmin"
echo "===================================="

# Остановка процессов на стандартных портах
echo "🔍 Поиск и остановка процессов..."

# Находим процессы на портах 3001 и 5173
BACKEND_PID=$(lsof -t -i:3001 2>/dev/null)
FRONTEND_PID=$(lsof -t -i:5173 2>/dev/null)

if [ ! -z "$BACKEND_PID" ]; then
    echo "🟢 Остановка Backend (PID: $BACKEND_PID)..."
    kill -TERM $BACKEND_PID 2>/dev/null
    sleep 2

    # Принудительно убиваем если еще работает
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔨 Принудительная остановка Backend..."
        kill -KILL $BACKEND_PID 2>/dev/null
    fi
    echo "✅ Backend остановлен"
else
    echo "ℹ️ Backend не запущен"
fi

if [ ! -z "$FRONTEND_PID" ]; then
    echo "🟦 Остановка Frontend (PID: $FRONTEND_PID)..."
    kill -TERM $FRONTEND_PID 2>/dev/null
    sleep 2

    # Принудительно убиваем если еще работает
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🔨 Принудительная остановка Frontend..."
        kill -KILL $FRONTEND_PID 2>/dev/null
    fi
    echo "✅ Frontend остановлен"
else
    echo "ℹ️ Frontend не запущен"
fi

# Очищаем PID файлы если есть
rm -f backend.pid frontend.pid 2>/dev/null

echo ""
echo "✅ Все сервисы остановлены!"
echo "📍 Порты 3001 и 5173 освобождены"
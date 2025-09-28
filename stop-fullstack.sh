#!/bin/bash

echo "🛑 Остановка RentAdmin"
echo "===================="

# Ищем и останавливаем процессы Node.js связанные с проектом
echo "Поиск запущенных процессов..."

# Останавливаем backend процессы
BACKEND_PIDS=$(pgrep -f "node.*server.js\|npm.*start" 2>/dev/null || true)
if [ ! -z "$BACKEND_PIDS" ]; then
    echo "Остановка backend процессов: $BACKEND_PIDS"
    kill $BACKEND_PIDS 2>/dev/null || true
fi

# Останавливаем frontend процессы
FRONTEND_PIDS=$(pgrep -f "vite\|npm.*dev" 2>/dev/null || true)
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "Остановка frontend процессов: $FRONTEND_PIDS"
    kill $FRONTEND_PIDS 2>/dev/null || true
fi

# Ждем завершения процессов
sleep 2

# Форсированная остановка если процессы не завершились
REMAINING=$(pgrep -f "node.*server.js\|npm.*start\|vite\|npm.*dev" 2>/dev/null || true)
if [ ! -z "$REMAINING" ]; then
    echo "Принудительная остановка оставшихся процессов: $REMAINING"
    kill -9 $REMAINING 2>/dev/null || true
fi

echo "✅ Все процессы остановлены"
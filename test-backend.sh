#!/bin/bash

# Простой тест backend сервера

echo "🧪 Тестирование backend сервера..."
echo "================================="

cd backend

echo "📍 Текущая директория: $(pwd)"
echo "👤 Пользователь: $(whoami)"

echo ""
echo "📦 Проверка dist/server.js:"
if [ -f "dist/server.js" ]; then
    echo "✅ Файл dist/server.js найден"
    echo "📊 Размер файла: $(stat -c%s dist/server.js) байт"
    echo "📅 Дата изменения: $(stat -c%y dist/server.js)"
else
    echo "❌ Файл dist/server.js не найден"
    exit 1
fi

echo ""
echo "📦 Проверка структуры dist:"
ls -la dist/

echo ""
echo "🔧 Попытка запуска напрямую:"
echo "Команда: node dist/server.js"
timeout 10s node dist/server.js &
BACKEND_PID=$!

echo "Ожидание запуска..."
sleep 3

if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend процесс запущен (PID: $BACKEND_PID)"

    # Проверка порта
    if lsof -i :3001 >/dev/null 2>&1; then
        echo "✅ Порт 3001 используется"

        # Тест health check
        if curl -s --max-time 2 http://localhost:3001/api/health >/dev/null 2>&1; then
            echo "✅ Health check успешен"
            curl -s http://localhost:3001/api/health
        else
            echo "❌ Health check не прошел"
        fi
    else
        echo "❌ Порт 3001 не используется"
    fi

    # Остановка процесса
    kill $BACKEND_PID 2>/dev/null
    echo "🛑 Backend остановлен"
else
    echo "❌ Backend процесс не запустился или завершился"
fi

echo ""
echo "📋 Логи запуска:"
if [ -f backend.log ]; then
    echo "--- backend.log ---"
    tail -10 backend.log
else
    echo "Лог файл не найден"
fi
#!/bin/bash

# Скрипт для диагностики проблем с RentAdmin на виртуальной машине

echo "🔍 Диагностика RentAdmin..."
echo "=========================="

# Проверка Docker
echo "📦 Проверка Docker контейнеров:"
if docker ps -a | grep rentadmin; then
    echo "✅ Docker контейнеры найдены"
    docker ps -a | grep rentadmin
else
    echo "❌ Docker контейнеры RentAdmin не найдены"
fi

echo ""

# Проверка процессов Node.js
echo "⚙️  Проверка backend процессов:"
if ps aux | grep -v grep | grep "node.*dist/server.js"; then
    echo "✅ Backend процессы найдены:"
    ps aux | grep -v grep | grep "node.*dist/server.js"
else
    echo "❌ Backend процессы не найдены"
fi

echo ""

# Проверка портов
echo "🌐 Проверка занятых портов:"
echo "Порт 80 (nginx):"
lsof -i :80 || echo "❌ Порт 80 не используется"
echo "Порт 3001 (backend):"
lsof -i :3001 || echo "❌ Порт 3001 не используется"

echo ""

# Проверка health checks
echo "🏥 Проверка health checks:"
echo "Backend health check:"
if curl -s --max-time 3 http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend отвечает:"
    curl -s http://localhost:3001/api/health
else
    echo "❌ Backend не отвечает"
fi

echo ""
echo "Nginx health check:"
if curl -s --max-time 3 http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx отвечает:"
    curl -s http://localhost/health
else
    echo "❌ Nginx не отвечает"
fi

echo ""
echo "Frontend доступность:"
if curl -s --max-time 3 http://localhost/ | grep -q "html"; then
    echo "✅ Frontend доступен"
else
    echo "❌ Frontend недоступен"
fi

echo ""

# Проверка логов
echo "📋 Проверка логов:"
if [ -f backend/backend.log ]; then
    echo "Backend лог (последние 5 строк):"
    tail -5 backend/backend.log
else
    echo "❌ Backend лог не найден"
fi

echo ""

# Проверка файлов PID
echo "📄 Проверка PID файлов:"
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    echo "Backend PID файл найден: $BACKEND_PID"
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "✅ Процесс $BACKEND_PID активен"
    else
        echo "❌ Процесс $BACKEND_PID не активен"
    fi
else
    echo "❌ Backend PID файл не найден"
fi

echo ""

# Проверка зависимостей
echo "📦 Проверка зависимостей:"
echo "Node.js версия:"
node --version || echo "❌ Node.js не установлен"
echo "NPM версия:"
npm --version || echo "❌ NPM не установлен"
echo "Docker версия:"
docker --version || echo "❌ Docker не установлен"

echo ""
echo "🔧 Для перезапуска используйте: ./start-vm.sh"
echo "🛑 Для остановки используйте: ./stop-vm.sh"
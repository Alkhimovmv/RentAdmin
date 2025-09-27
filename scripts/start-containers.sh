#!/bin/bash

# Запуск контейнеров с правильной сборкой backend
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"

echo "🚀 Запуск контейнеров..."

ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /home/user1/RentAdmin

    echo "📥 Получение последних изменений..."
    git pull origin main

    echo "🔧 Сборка backend локально..."
    cd backend
    npm run build
    cd ..

    echo "🐳 Остановка контейнеров..."
    docker-compose down

    echo "🔨 Пересборка backend контейнера..."
    docker-compose build backend --no-cache

    echo "▶️ Запуск контейнеров..."
    docker-compose up -d

    echo "⏱️ Ожидание запуска..."
    sleep 10

    echo "✅ Проверка статуса:"
    docker-compose ps

    echo -e "\n📋 Логи backend:"
    docker-compose logs --tail=15 backend

    echo -e "\n🧪 Быстрый тест:"
    echo "1. Backend прямо:"
    curl -s http://localhost:3001/api/health | head -1 || echo "Backend не отвечает"

    echo -e "\n2. CORS тест:"
    curl -s -I -H "Origin: https://vozmimenjaadmin.netlify.app" http://localhost:3001/api/health | grep -i access-control || echo "CORS не работает"

    echo -e "\n3. Через nginx HTTPS:"
    curl -s -k https://localhost/api/health | head -1 || echo "Nginx не работает"

    echo -e "\n🎯 Финальная проверка контейнеров:"
    docker-compose ps | grep -E "(Up|healthy)" || echo "Контейнеры не запущены"
EOF

echo "🎉 Контейнеры запущены!"
echo "🌐 Тестируйте: http://87.242.103.146/api/health"
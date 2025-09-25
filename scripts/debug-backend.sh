#!/bin/bash

# Отладка backend CORS
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"

echo "🔍 Отладка backend CORS..."

ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /home/user1/RentAdmin

    echo "=== 📋 Статус контейнеров ==="
    docker-compose ps

    echo -e "\n=== 📦 Версия кода в backend контейнере ==="
    docker-compose exec -T backend cat /app/dist/server.js | grep -A5 -B5 "CORS" || echo "CORS код не найден"

    echo -e "\n=== 🔧 Environment переменные ==="
    docker-compose exec -T backend env | grep -E "(CORS|NODE_ENV)" || echo "Переменные не найдены"

    echo -e "\n=== 📋 Логи backend (последние 20 строк) ==="
    docker-compose logs --tail=20 backend

    echo -e "\n=== 🧪 Прямые тесты backend ==="
    echo "1. Простой GET запрос:"
    curl -s http://localhost:3001/api/health | jq . || echo "Backend не отвечает"

    echo -e "\n2. GET с Origin заголовком:"
    curl -s -I -H "Origin: https://vozmimenjaadmin.netlify.app" http://localhost:3001/api/health | head -15

    echo -e "\n3. OPTIONS preflight запрос:"
    curl -s -I -X OPTIONS -H "Origin: https://vozmimenjaadmin.netlify.app" -H "Access-Control-Request-Method: GET" http://localhost:3001/api/health | head -15

    echo -e "\n=== 📁 Проверка файлов в контейнере ==="
    docker-compose exec -T backend ls -la /app/dist/ || echo "Файлы не найдены"

    echo -e "\n=== 🔄 Пересборка и перезапуск backend ==="
    echo "Сборка нового кода..."
    cd backend && npm run build && cd ..

    echo "Копирование в контейнер..."
    docker cp backend/dist/. rent-admin-backend:/app/dist/

    echo "Перезапуск контейнера..."
    docker-compose restart backend

    echo "Ожидание..."
    sleep 8

    echo -e "\n=== ✅ Финальный тест после обновления ==="
    curl -s -I -H "Origin: https://vozmimenjaadmin.netlify.app" http://localhost:3001/api/health | grep -i access-control || echo "❌ CORS всё ещё не работает"

    echo -e "\n=== 📋 Логи после перезапуска ==="
    docker-compose logs --tail=10 backend | grep -E "(CORS|origin|запущен)" || echo "Логи не найдены"
EOF

echo "🎯 Отладка завершена!"
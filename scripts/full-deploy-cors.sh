#!/bin/bash

# Полное развертывание с исправлением CORS
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"
PROJECT_PATH="/home/user1/RentAdmin"

echo "🚀 Полное развертывание с исправлением CORS..."

# Развертываем на сервере
echo "📡 Развертывание на сервере..."
ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /home/user1/RentAdmin

    echo "📥 Получение изменений..."
    git pull origin main

    echo "🔧 Сборка backend..."
    cd backend
    npm run build
    cd ..

    echo "🐳 Перезапуск контейнеров..."
    docker-compose down
    docker-compose up -d

    echo "⏱️  Ожидание запуска..."
    sleep 10

    echo "✅ Проверка статуса:"
    docker-compose ps

    echo -e "\n📋 Логи backend (последние 15 строк):"
    docker-compose logs --tail=15 backend

    echo -e "\n🧪 Тесты CORS:"
    echo "1. Прямой тест backend:"
    curl -s -H "Origin: https://vozmimenjaadmin.netlify.app" -I http://localhost:3001/api/health | grep -i access-control || echo "❌ Нет CORS в backend"

    echo -e "\n2. Тест через nginx:"
    curl -s -k -H "Origin: https://vozmimenjaadmin.netlify.app" -I https://localhost/api/health | grep -i access-control || echo "❌ Нет CORS через nginx"

    echo -e "\n3. Проверка JSON ответа:"
    curl -s http://localhost:3001/api/health | jq . || echo "Backend возвращает некорректный JSON"

    echo -e "\n📊 Итоговый статус:"
    if curl -s https://localhost/api/health > /dev/null; then
        echo "✅ API доступен через HTTPS"
    else
        echo "❌ API недоступен через HTTPS"
    fi
EOF

echo "🎉 Развертывание завершено!"
echo "🌐 Проверьте приложение: https://vozmimenjaadmin.netlify.app"
echo "🔍 Если проблемы остаются, запустите: ./scripts/test-cors.sh"
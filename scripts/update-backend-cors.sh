#!/bin/bash

# Обновление backend с правильным CORS
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"
PROJECT_PATH="/home/user1/RentAdmin"

echo "🔧 Обновление backend с правильным CORS..."

# 1. Коммитим изменения
git add .
git commit -m "fix: правильная настройка CORS в backend

- CORS обрабатывается только в backend
- Убраны дублированные заголовки
- Один origin без массива
- Добавлен optionsSuccessStatus для старых браузеров" || echo "Нет изменений"

git push origin main

# 2. Обновляем на сервере
echo "📡 Обновление на сервере..."
ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /home/user1/RentAdmin

    echo "📥 Получение изменений..."
    git pull origin main

    echo "🔄 Копирование обновленного backend..."
    docker cp backend/dist/. rent-admin-backend:/app/dist/

    echo "🔄 Перезапуск backend контейнера..."
    docker-compose restart backend

    echo "⏱️  Ожидание запуска..."
    sleep 5

    echo "✅ Проверка статуса:"
    docker-compose ps backend

    echo "📋 Логи backend (последние 10 строк):"
    docker-compose logs --tail=10 backend

    echo -e "\n🧪 Тест CORS:"
    curl -s -H "Origin: https://vozmimenjaadmin.netlify.app" http://localhost:3001/api/health | head -1 || echo "Backend недоступен"

    echo -e "\n🌐 Тест через nginx:"
    curl -s https://localhost/api/health | head -1 || echo "Nginx недоступен"
EOF

echo "🎉 Backend обновлен!"
echo "🌐 Проверьте приложение: https://vozmimenjaadmin.netlify.app"
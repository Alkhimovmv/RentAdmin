#!/bin/bash

# Быстрое исправление CORS - отключаем в backend, включаем в nginx
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"
PROJECT_PATH="/home/user1/RentAdmin"

echo "🚀 Исправление CORS через nginx..."

# 1. Сохраняем текущий server.ts
cp backend/src/server.ts backend/src/server-with-cors.ts.backup

# 2. Используем версию без CORS
cp backend/src/server-no-cors.ts backend/src/server.ts

# 3. Пересобираем
cd backend && npm run build && cd ..

# 4. Коммитим изменения
git add .
git commit -m "fix: отключение CORS в backend, обработка в nginx

- Backend больше не устанавливает CORS заголовки
- CORS обрабатывается только в nginx
- Добавлена конфигурация nginx-cors-fix.conf" || echo "Нет изменений"

git push origin main

# 5. Развертываем на сервере
echo "📡 Развертывание на сервере..."
ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /home/user1/RentAdmin

    # Получаем изменения
    git pull origin main

    # Копируем новую nginx конфигурацию (если есть права)
    if [ -f nginx-cors-fix.conf ]; then
        echo "📋 Обновление nginx конфигурации..."
        sudo cp nginx-cors-fix.conf /etc/nginx/nginx.conf || echo "Нет прав на обновление nginx конфига"
        sudo nginx -t && sudo systemctl reload nginx || echo "Ошибка перезагрузки nginx"
    fi

    # Пересобираем backend
    docker-compose down
    docker-compose build backend --no-cache
    docker-compose up -d

    # Проверяем
    echo "✅ Статус контейнеров:"
    docker-compose ps

    echo "🔍 Тест CORS заголовков:"
    curl -H "Origin: https://vozmimenjaadmin.netlify.app" -I https://localhost/api/health 2>/dev/null | grep -i access-control || echo "CORS заголовки не найдены"
EOF

echo "🎉 CORS исправление развернуто!"
echo "💡 Если проблема остается, запустите: ./scripts/diagnose-cors.sh"
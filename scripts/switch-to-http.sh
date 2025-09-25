#!/bin/bash

# Быстрое решение SSL проблемы - переключение на HTTP
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"

echo "🔄 Переключение на HTTP для решения SSL проблемы..."

# 1. Коммитим HTTP конфигурацию
git add nginx-http-only.conf
git commit -m "feat: HTTP-only конфигурация nginx для решения SSL проблемы

- Отключен HTTPS редирект
- Работа только по HTTP порту 80
- CORS обрабатывается в backend
- Решение проблемы с самоподписанным сертификатом" || echo "Нет изменений"

git push origin main

# 2. Применяем на сервере
echo "📡 Переключение на HTTP на сервере..."
ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /home/user1/RentAdmin

    echo "📥 Получение изменений..."
    git pull origin main

    echo "📋 Backup nginx конфигурации..."
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.https.backup

    echo "📝 Применение HTTP конфигурации..."
    sudo cp nginx-http-only.conf /etc/nginx/nginx.conf

    echo "✅ Проверка конфигурации..."
    sudo nginx -t

    echo "🔄 Перезагрузка nginx..."
    sudo systemctl reload nginx

    echo "⏱️ Ожидание..."
    sleep 3

    echo "🧪 Тестирование HTTP:"
    echo "1. Простой запрос:"
    curl -s http://localhost/api/health | head -1 || echo "HTTP не работает"

    echo -e "\n2. CORS тест:"
    curl -s -I -H "Origin: https://vozmimenjaadmin.netlify.app" http://localhost:3001/api/health | grep -i access-control || echo "CORS не работает в backend"

    echo -e "\n3. Через nginx:"
    curl -s -I -H "Origin: https://vozmimenjaadmin.netlify.app" http://localhost/api/health | grep -i access-control || echo "CORS не проходит через nginx"

    echo -e "\n📊 Статус nginx:"
    sudo systemctl status nginx --no-pager | head -3
EOF

echo "🎉 Переключение на HTTP завершено!"
echo "⚠️ Обновите frontend для использования HTTP вместо HTTPS"
echo "🌐 Новый API URL: http://$SERVER_HOST/api"
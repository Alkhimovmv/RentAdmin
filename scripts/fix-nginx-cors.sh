#!/bin/bash

# Исправление nginx конфигурации - убираем CORS заголовки
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"

echo "🔧 Исправление nginx конфигурации..."

# 1. Коммитим новую конфигурацию
git add nginx-no-cors.conf
git commit -m "feat: nginx конфигурация без CORS заголовков

- Убраны все CORS заголовки из nginx
- CORS обрабатывается только в backend
- Исправлен OPTIONS handling
- Добавлен health check endpoint" || echo "Нет изменений"

git push origin main

# 2. Обновляем конфигурацию на сервере
echo "📡 Обновление nginx конфигурации на сервере..."
ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    cd /home/user1/RentAdmin

    echo "📥 Получение изменений..."
    git pull origin main

    echo "📋 Backup текущей конфигурации..."
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

    echo "📝 Применение новой конфигурации..."
    sudo cp nginx-no-cors.conf /etc/nginx/nginx.conf

    echo "✅ Проверка конфигурации nginx..."
    sudo nginx -t

    if [ $? -eq 0 ]; then
        echo "🔄 Перезагрузка nginx..."
        sudo systemctl reload nginx
        echo "✅ Nginx перезагружен успешно"
    else
        echo "❌ Ошибка в конфигурации nginx!"
        echo "🔙 Восстанавливаем backup..."
        sudo cp /etc/nginx/nginx.conf.backup.* /etc/nginx/nginx.conf
        sudo nginx -t && sudo systemctl reload nginx
        exit 1
    fi

    echo -e "\n🔧 Перезапуск backend контейнера..."
    cd /home/user1/RentAdmin
    docker-compose restart backend

    echo "⏱️ Ожидание запуска..."
    sleep 5

    echo -e "\n🧪 Тестирование CORS:"
    echo "1. Прямой тест backend:"
    curl -s -I -H "Origin: https://vozmimenjaadmin.netlify.app" http://localhost:3001/api/health | grep -i access-control || echo "❌ Нет CORS в backend"

    echo -e "\n2. Тест через nginx HTTPS:"
    curl -s -k -I -H "Origin: https://vozmimenjaadmin.netlify.app" https://localhost/api/health | grep -i access-control || echo "❌ Нет CORS через nginx"

    echo -e "\n3. Проверка OPTIONS preflight:"
    curl -s -k -X OPTIONS -H "Origin: https://vozmimenjaadmin.netlify.app" -H "Access-Control-Request-Method: GET" https://localhost/api/health | head -1 || echo "❌ OPTIONS не работает"

    echo -e "\n📊 Статус nginx:"
    sudo systemctl status nginx --no-pager | head -3
EOF

echo "🎉 Nginx конфигурация обновлена!"
echo "🌐 Проверьте приложение: https://vozmimenjaadmin.netlify.app"
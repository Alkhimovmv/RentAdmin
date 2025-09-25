#!/bin/bash

# Тестирование CORS на сервере
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"

echo "🧪 Тестирование CORS на сервере..."

ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    echo "=== 🔍 Тест CORS заголовков ==="

    echo "1. Прямое обращение к backend:"
    curl -I http://localhost:3001/api/health 2>/dev/null | grep -i access-control || echo "❌ Нет CORS в backend"

    echo -e "\n2. Обращение через nginx HTTP:"
    curl -I http://localhost/api/health 2>/dev/null | grep -i access-control || echo "❌ Нет CORS через nginx HTTP"

    echo -e "\n3. Обращение через nginx HTTPS:"
    curl -k -I https://localhost/api/health 2>/dev/null | grep -i access-control || echo "❌ Нет CORS через nginx HTTPS"

    echo -e "\n4. Тест с Origin заголовком:"
    curl -k -H "Origin: https://vozmimenjaadmin.netlify.app" -I https://localhost/api/health 2>/dev/null | grep -i access-control || echo "❌ Нет CORS с Origin"

    echo -e "\n5. Тест OPTIONS preflight:"
    curl -k -X OPTIONS -H "Origin: https://vozmimenjaadmin.netlify.app" -H "Access-Control-Request-Method: GET" https://localhost/api/health 2>/dev/null | grep -i access-control || echo "❌ Нет CORS для OPTIONS"

    echo -e "\n=== 📋 Статус nginx ==="
    sudo systemctl status nginx --no-pager | head -10

    echo -e "\n=== 🔧 Проверка nginx конфигурации ==="
    sudo nginx -t

    echo -e "\n=== 📄 Текущая конфигурация nginx (CORS секция) ==="
    sudo cat /etc/nginx/nginx.conf | grep -A20 -B5 -i "add_header.*access-control" || echo "CORS заголовки не найдены в конфиге"
EOF

echo "🎯 Тестирование завершено!"
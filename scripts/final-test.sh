#!/bin/bash

# Финальная проверка CORS и SSL
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"

echo "🎯 Финальная проверка CORS и SSL..."

ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    echo "=== 🐳 Статус контейнеров ==="
    docker-compose ps

    echo -e "\n=== 🔒 SSL сертификат ==="
    echo "Информация о сертификате:"
    openssl x509 -in /etc/nginx/ssl/server.crt -text -noout | grep -A 2 "Subject:"
    openssl x509 -in /etc/nginx/ssl/server.crt -text -noout | grep -A 2 "X509v3 Subject Alternative Name"

    echo -e "\n=== 🧪 Тесты API ==="
    echo "1. HTTP health check:"
    curl -s http://localhost/api/health | jq .status || echo "HTTP не работает"

    echo -e "\n2. HTTPS health check (игнорируя SSL):"
    curl -s -k https://localhost/api/health | jq .status || echo "HTTPS не работает"

    echo -e "\n3. CORS test (прямой backend):"
    curl -s -I -H "Origin: https://vozmimenjaadmin.netlify.app" http://localhost:3001/api/health | grep -i access-control || echo "❌ CORS не работает в backend"

    echo -e "\n4. CORS test (через nginx HTTPS):"
    curl -s -k -I -H "Origin: https://vozmimenjaadmin.netlify.app" https://localhost/api/health | grep -i access-control || echo "❌ CORS не работает через nginx"

    echo -e "\n5. OPTIONS preflight test:"
    curl -s -k -X OPTIONS -H "Origin: https://vozmimenjaadmin.netlify.app" -H "Access-Control-Request-Method: GET" https://localhost/api/health -w "HTTP Status: %{http_code}\n" | head -1

    echo -e "\n=== 📋 Логи backend (поиск CORS) ==="
    docker-compose logs --tail=20 backend | grep -E "(CORS|origin|запущен)" || echo "CORS логи не найдены"

    echo -e "\n=== 📊 Итоговое состояние ==="
    echo "Backend контейнер: $(docker-compose ps -q backend | wc -l) из 1"
    echo "Nginx статус: $(sudo systemctl is-active nginx)"
    echo "SSL сертификат срок действия: $(openssl x509 -in /etc/nginx/ssl/server.crt -noout -enddate)"
EOF

echo -e "\n🎉 Проверка завершена!"
echo -e "\n📋 Инструкции для пользователя:"
echo "1. 🌐 Откройте http://87.242.103.146/api/health в браузере"
echo "2. 🔒 При предупреждении SSL нажмите 'Дополнительно' → 'Перейти на сайт'"
echo "3. ✅ Должен отобразиться JSON с информацией о статусе"
echo "4. 📱 Обновите frontend на Netlify с новым API URL: http://87.242.103.146/api"
echo -e "\n📖 Подробные инструкции: см. SSL-TRUST-INSTRUCTIONS.md"
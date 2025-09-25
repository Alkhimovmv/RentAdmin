#!/bin/bash

# Диагностика CORS проблемы на сервере
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"
PROJECT_PATH="/home/user1/RentAdmin"

echo "🔍 Диагностика CORS проблемы..."

# Подключаемся к серверу и проверяем конфигурацию
ssh -t $SERVER_USER@$SERVER_HOST << 'EOF'
    echo "=== 🐳 Docker контейнеры ==="
    docker-compose ps

    echo -e "\n=== 📋 Логи backend (CORS) ==="
    docker-compose logs backend | grep -i cors || echo "CORS логи не найдены"

    echo -e "\n=== 🌐 Nginx конфигурация ==="
    if [ -f /etc/nginx/nginx.conf ]; then
        echo "Основная конфигурация nginx:"
        cat /etc/nginx/nginx.conf | grep -A10 -B10 -i cors || echo "CORS настройки не найдены в основной конфиге"
    fi

    if [ -f /etc/nginx/sites-enabled/default ]; then
        echo -e "\nДефолтный сайт nginx:"
        cat /etc/nginx/sites-enabled/default | grep -A10 -B10 -i cors || echo "CORS настройки не найдены в дефолтном сайте"
    fi

    echo -e "\n=== 🔌 Активные nginx процессы ==="
    ps aux | grep nginx

    echo -e "\n=== 📡 Тест прямого обращения к backend ==="
    echo "Тестируем http://localhost:3001/api/health"
    curl -v http://localhost:3001/api/health 2>&1 | grep -i "access-control" || echo "Нет CORS заголовков в прямом обращении"

    echo -e "\n=== 📡 Тест через nginx ==="
    echo "Тестируем http://localhost/api/health"
    curl -v http://localhost/api/health 2>&1 | grep -i "access-control" || echo "Нет CORS заголовков через nginx"

    echo -e "\n=== 🔧 Environment переменные backend ==="
    docker-compose exec -T backend env | grep -E "(CORS|NODE_ENV)" || echo "Переменные не найдены"

    echo -e "\n=== 📁 Файлы конфигурации в проекте ==="
    ls -la /home/user1/RentAdmin/*.conf || echo "Конфигурационные файлы не найдены"
EOF

echo "🎯 Диагностика завершена!"
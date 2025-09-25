#!/bin/bash

# Deploy script for RentAdmin on remote server
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"
PROJECT_PATH="/home/user1/RentAdmin"

echo "🚀 Развертывание RentAdmin на сервере..."

    # Останавливаем контейнеры
    echo "⏹️  Остановка контейнеров..."
    docker-compose down

    # Пересобираем backend контейнер
    echo "🔨 Пересборка backend контейнера..."
    docker-compose build backend --no-cache

    # Запускаем контейнеры
    echo "▶️  Запуск контейнеров..."
    docker-compose up -d

    # Проверяем статус
    echo "✅ Проверка статуса контейнеров..."
    docker-compose ps
EOF

echo "🎉 Развертывание завершено!"
echo "🌐 Проверьте ваше приложение: https://$SERVER_HOST"
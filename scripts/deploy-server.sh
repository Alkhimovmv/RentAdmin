#!/bin/bash

# Deploy script for RentAdmin on remote server
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"
PROJECT_PATH="/path/to/RentAdmin"

echo "🚀 Развертывание RentAdmin на сервере..."


# 2. Подключаемся к серверу и обновляем код
echo "🔄 Обновление кода на сервере..."
ssh $SERVER_USER@$SERVER_HOST << EOF
    # Получаем последние изменения
    git pull origin main

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
#!/bin/bash

# Deploy CORS fix to remote server
set -e

SERVER_USER="user1"
SERVER_HOST="87.242.103.146"
PROJECT_PATH="/home/user1/RentAdmin"

echo "🚀 Развертывание CORS исправлений на сервере..."
    # Останавливаем контейнеры
    echo "⏹️  Остановка контейнеров..."
    docker-compose down

    # Пересобираем backend контейнер с исправлениями
    echo "🔨 Пересборка backend контейнера..."
    docker-compose build backend --no-cache

    # Запускаем контейнеры
    echo "▶️  Запуск контейнеров..."
    docker-compose up -d

    # Проверяем статус
    echo "✅ Проверка статуса контейнеров..."
    docker-compose ps

    echo "📋 Проверка логов backend (первые 20 строк)..."
    docker-compose logs --tail=20 backend

echo "🎉 CORS исправления развернуты!"
echo "🌐 Проверьте ваше приложение: https://$SERVER_HOST"
echo "🔍 Проверьте CORS логи: docker-compose logs backend | grep CORS"
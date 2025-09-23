#!/bin/bash

# 🚀 Скрипт развертывания RentAdmin
# Автоматизированное развертывание backend на Yandex Cloud

set -e

echo "🚀 Начинаем развертывание RentAdmin..."

# Переменные
BACKEND_DIR="./backend"
ENV_FILE="$BACKEND_DIR/.env.production"

# Проверка наличия файла окружения
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Файл $ENV_FILE не найден!"
    echo "Создайте его на основе .env.example и заполните реальными данными"
    exit 1
fi

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен!"
    exit 1
fi

echo "✅ Проверки пройдены"

# Остановка существующих контейнеров
echo "🛑 Остановка существующих контейнеров..."
docker-compose -f docker-compose.prod.yml down || true

# Сборка новых образов
echo "🔨 Сборка Docker образов..."
docker-compose -f docker-compose.prod.yml build

# Запуск контейнеров
echo "🚀 Запуск контейнеров..."
docker-compose -f docker-compose.prod.yml up -d

# Ожидание запуска
echo "⏳ Ожидание запуска сервисов..."
sleep 10

# Проверка здоровья
echo "🔍 Проверка работоспособности..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend запущен успешно!"
else
    echo "❌ Backend не отвечает на health check"
    echo "Проверьте логи: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Запуск миграций
echo "🗄️  Запуск миграций базы данных..."
docker-compose -f docker-compose.prod.yml exec -T backend npm run db:migrate

echo "🎉 Развертывание завершено успешно!"
echo "📊 Для просмотра логов: docker-compose -f docker-compose.prod.yml logs -f"
echo "📊 Для остановки: docker-compose -f docker-compose.prod.yml down"
echo "🌐 API доступен по адресу: http://localhost:3001/api"
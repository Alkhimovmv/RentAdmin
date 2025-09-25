#!/bin/bash

# Запуск полного стека RentAdmin (Frontend + Backend + Database)
# на сервере 87.242.103.146

set -e

echo "🚀 Запуск RentAdmin Full Stack"
echo "==============================================="
echo "Frontend: https://87.242.103.146/"
echo "API: https://87.242.103.146/api/"
echo "Database: PostgreSQL на порту 5432"
echo "==============================================="
echo ""

# Проверяем наличие SSL сертификата
if [ ! -f "./nginx/ssl/cert.pem" ]; then
    echo "⚠️  SSL сертификат не найден. Создаем новый..."
    ./scripts/create-ssl-cert.sh
else
    echo "✅ SSL сертификат найден"
fi

# Останавливаем существующие контейнеры если есть
echo "🛑 Остановка существующих контейнеров..."
docker-compose -f docker-compose-fullstack.yml down --remove-orphans 2>/dev/null || true

# Очищаем old images
echo "🧹 Очистка старых образов..."
docker system prune -f --volumes 2>/dev/null || true

# Собираем и запускаем контейнеры
echo "🔨 Сборка и запуск контейнеров..."
docker-compose -f docker-compose-fullstack.yml up --build -d

echo "⏳ Ждем запуска всех сервисов..."
sleep 20

# Проверяем статус контейнеров
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose-fullstack.yml ps

echo ""
echo "🔍 Проверка доступности сервисов:"

# Проверяем database
echo -n "Database: "
if docker exec rent-admin-db pg_isready -U postgres -d rent_admin >/dev/null 2>&1; then
    echo "✅ Online"
else
    echo "❌ Offline"
fi

# Проверяем backend
echo -n "Backend API: "
if curl -s -k https://87.242.103.146/api/health >/dev/null 2>&1; then
    echo "✅ Online"
else
    echo "❌ Offline"
fi

# Проверяем frontend
echo -n "Frontend: "
if curl -s -k https://87.242.103.146/ >/dev/null 2>&1; then
    echo "✅ Online"
else
    echo "❌ Offline"
fi

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "📱 ДОСТУП К ПРИЛОЖЕНИЮ:"
echo "🌐 Frontend: https://87.242.103.146/"
echo "🔌 API: https://87.242.103.146/api/"
echo "📚 API Docs: https://87.242.103.146/docs"
echo "❤️ Health Check: https://87.242.103.146/health"
echo ""
echo "⚠️  SSL ПРЕДУПРЕЖДЕНИЕ:"
echo "При первом доступе браузер покажет предупреждение о сертификате."
echo "Нажмите 'Дополнительно' → 'Перейти на сайт (небезопасно)'"
echo ""
echo "📋 УПРАВЛЕНИЕ:"
echo "▶️  Запустить: ./scripts/start-fullstack.sh"
echo "⏹️  Остановить: docker-compose -f docker-compose-fullstack.yml down"
echo "🔄 Перезапустить: docker-compose -f docker-compose-fullstack.yml restart"
echo "📋 Логи: docker-compose -f docker-compose-fullstack.yml logs -f"
echo ""
echo "🐛 В СЛУЧАЕ ПРОБЛЕМ:"
echo "1. Проверить логи: docker-compose -f docker-compose-fullstack.yml logs"
echo "2. Перезапустить: docker-compose -f docker-compose-fullstack.yml restart"
echo "3. Полная пересборка: docker-compose -f docker-compose-fullstack.yml up --build --force-recreate -d"
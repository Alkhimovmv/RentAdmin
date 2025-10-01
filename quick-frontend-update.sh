#!/bin/bash

# Быстрое обновление фронтенда на VM
# Только пересборка фронтенда и перезапуск nginx

set -e

echo "🚀 Быстрое обновление фронтенда на VM"
echo "======================================"
echo ""

# 1. Пересборка frontend
echo "1️⃣  Пересборка frontend..."
cd frontend

# Удаляем старую сборку
rm -rf dist/
echo "🗑️  Старая сборка удалена"

# Сборка с production окружением
echo "🔨 Сборка frontend для production..."
if npm run build; then
    if [ -f "dist/index.html" ]; then
        echo "✅ Frontend собран успешно"
        echo "📊 Размер: $(du -sh dist/ | cut -f1)"
        echo "🔗 API URL: $(grep VITE_API_URL .env.production)"
    else
        echo "❌ Файл dist/index.html не создан"
        exit 1
    fi
else
    echo "❌ Ошибка сборки frontend"
    exit 1
fi

cd ..

# 2. Перезапуск nginx (если запущен)
echo ""
echo "2️⃣  Перезапуск nginx..."
if docker ps -q --filter "name=rentadmin_nginx" | grep -q .; then
    docker restart rentadmin_nginx
    echo "✅ Nginx перезапущен"
else
    echo "ℹ️  Nginx не запущен, запускаем..."
    docker-compose -f docker-compose.host.yml up -d
    echo "✅ Nginx запущен"
fi

# 3. Проверка
echo ""
echo "3️⃣  Проверка frontend..."
sleep 2

if curl -s http://localhost/ | grep -q "html"; then
    echo "✅ Frontend доступен"
else
    echo "⚠️  Frontend может быть недоступен"
fi

echo ""
echo "🎉 Обновление завершено!"
echo ""
echo "📍 Приложение: http://87.242.103.146"
echo ""
echo "💡 Не забудьте очистить кеш браузера (Ctrl+F5)"
echo ""

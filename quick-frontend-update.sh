#!/bin/bash

# Быстрое обновление фронтенда на сервере
# Git pull + пересборка фронтенда + перезапуск nginx

set -e

echo "🚀 Быстрое обновление фронтенда"
echo "================================"
echo ""

# 0. Git pull
echo "📥 Получение обновлений из Git..."
git pull
echo "✅ Git pull выполнен"
echo ""

# 1. Пересборка frontend
echo "1️⃣  Пересборка frontend..."
cd frontend

# Установка зависимостей если нужно
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

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
echo "🎉 Обновление фронтенда завершено!"
echo "===================================="
echo ""
echo "📍 Приложение доступно:"
echo "   🌐 http://87.242.103.146"
echo "   🏠 http://localhost"
echo ""
echo "💡 Полезные советы:"
echo "   • Очистите кеш браузера (Ctrl+F5)"
echo "   • Проверьте логи: docker logs rentadmin_nginx"
echo ""
echo "📊 Время обновления: ~2-3 минуты"
echo ""

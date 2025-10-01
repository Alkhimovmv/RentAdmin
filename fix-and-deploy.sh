#!/bin/bash

# Полное исправление и развертывание фронтенда на VM
# Автоматически останавливает системный nginx если нужно

set -e

echo "🔧 Исправление и развертывание фронтенда на VM"
echo "=============================================="
echo ""

# Функция для освобождения порта 80
free_port_80() {
    echo "🔍 Проверка порта 80..."

    # Проверяем системный nginx
    if systemctl is-active --quiet nginx 2>/dev/null; then
        echo "⚠️  Найден системный nginx, останавливаем..."
        sudo systemctl stop nginx
        sudo systemctl disable nginx 2>/dev/null || true
        echo "✅ Системный nginx остановлен"
    fi

    # Проверяем Apache
    if systemctl is-active --quiet apache2 2>/dev/null; then
        echo "⚠️  Найден Apache, останавливаем..."
        sudo systemctl stop apache2
        sudo systemctl disable apache2 2>/dev/null || true
        echo "✅ Apache остановлен"
    fi

    # Проверяем что порт свободен
    if sudo lsof -i :80 >/dev/null 2>&1; then
        echo "⚠️  Порт 80 всё ещё занят, принудительно освобождаем..."
        sudo lsof -ti :80 | xargs -r sudo kill -9 2>/dev/null || true
        sleep 2
    fi

    echo "✅ Порт 80 свободен"
}

# 1. Освобождаем порт 80
free_port_80
echo ""

# 2. Остановка Docker контейнеров
echo "🛑 Остановка Docker контейнеров..."
docker stop rentadmin_nginx 2>/dev/null || true
docker rm rentadmin_nginx 2>/dev/null || true
echo "✅ Docker контейнеры остановлены"
echo ""

# 3. Очистка и пересборка frontend
echo "🌐 Пересборка frontend..."
cd frontend
rm -rf dist/ node_modules/.vite/

NODE_ENV=production npm run build

if [ ! -f "dist/index.html" ]; then
    echo "❌ Ошибка сборки frontend"
    exit 1
fi

NEW_HASH=$(ls dist/assets/index-*.js | xargs basename)
echo "✅ Frontend собран: $NEW_HASH"
cd ..
echo ""

# 4. Запуск nginx
echo "🐳 Запуск nginx..."
docker-compose -f docker-compose.host.yml up -d

# Ждем запуска
echo "⏳ Ожидание запуска nginx (до 30 секунд)..."
for i in {1..30}; do
    if docker ps --filter "name=rentadmin_nginx" --filter "status=running" | grep -q rentadmin && \
       curl -s http://localhost/ >/dev/null 2>&1; then
        echo "✅ Nginx запущен и отвечает на запросы"
        break
    fi

    if [ $i -eq 30 ]; then
        echo "❌ Nginx не запустился за 30 секунд"
        echo "📋 Логи Docker:"
        docker logs rentadmin_nginx --tail 30
        exit 1
    fi
    sleep 1
done

echo ""

# 5. Проверка
echo "✅ Проверка обновления..."
SERVED_HASH=$(curl -s http://localhost/ | grep -o 'index-[^.]*\.js' | head -1)
echo "📦 Nginx раздает: $SERVED_HASH"

if [ "$SERVED_HASH" = "$NEW_HASH" ]; then
    echo "✅ Обновление успешно!"
else
    echo "⚠️  Предупреждение: Хеши не совпадают"
    echo "   Собран: $NEW_HASH"
    echo "   Раздается: $SERVED_HASH"
fi

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "📍 Откройте: http://87.242.103.146"
echo "🔑 Очистите кеш браузера: Ctrl+F5"
echo ""
echo "📝 В консоли должно быть:"
echo "   🔧 Production mode: using fixed API URL: http://87.242.103.146/api"
echo ""

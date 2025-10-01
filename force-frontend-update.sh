#!/bin/bash

# Принудительное обновление фронтенда на VM с очисткой кеша

set -e

echo "🔄 ПРИНУДИТЕЛЬНОЕ обновление фронтенда на VM"
echo "============================================"
echo ""

# 1. Остановка nginx
echo "1️⃣  Остановка nginx..."
docker stop rentadmin_nginx 2>/dev/null || true
docker rm rentadmin_nginx 2>/dev/null || true
echo "✅ Nginx остановлен и удален"
echo ""

# 2. Полная очистка старой сборки
echo "2️⃣  Очистка старой сборки..."
cd frontend
rm -rf dist/
rm -rf node_modules/.vite/
echo "✅ Старая сборка и кеш Vite удалены"
echo ""

# 3. Пересборка с чистого листа
echo "3️⃣  Пересборка фронтенда..."
echo "📦 Проверка зависимостей..."
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🔨 Сборка для production..."
NODE_ENV=production npm run build

if [ -f "dist/index.html" ]; then
    echo "✅ Фронтенд собран успешно"
    echo "📊 Размер: $(du -sh dist/ | cut -f1)"

    # Показываем хеш нового файла
    NEW_HASH=$(ls dist/assets/index-*.js | xargs basename)
    echo "🔑 Новый хеш файла: $NEW_HASH"
else
    echo "❌ Ошибка сборки"
    exit 1
fi

cd ..
echo ""

# 4. Перезапуск nginx с новыми файлами
echo "4️⃣  Запуск nginx с новыми файлами..."
docker-compose -f docker-compose.host.yml up -d

echo "⏳ Ожидание запуска nginx..."
sleep 3

# Проверяем что nginx работает (не смотрим на логи bind errors - они могут быть из-за retry)
if docker ps --filter "name=rentadmin_nginx" --filter "status=running" | grep -q rentadmin; then
    # Дополнительно проверяем что nginx отвечает на запросы
    if curl -s http://localhost/ > /dev/null 2>&1; then
        echo "✅ Nginx запущен с новыми файлами и отвечает на запросы"
    else
        echo "⚠️  Nginx запущен, но не отвечает на запросы"
        echo "📋 Логи nginx:"
        docker logs rentadmin_nginx --tail 20
    fi
else
    echo "❌ Nginx не запустился"
    echo "📋 Логи nginx:"
    docker logs rentadmin_nginx --tail 20
    exit 1
fi

echo ""

# 5. Проверка
echo "5️⃣  Проверка обновления..."
sleep 2

# Проверяем что nginx раздает новые файлы
SERVED_HASH=$(curl -s http://localhost/ | grep -o 'index-[^.]*\.js' | head -1)
echo "📦 Nginx раздает: $SERVED_HASH"

if [ "$SERVED_HASH" = "$NEW_HASH" ]; then
    echo "✅ Файлы обновлены корректно"
else
    echo "⚠️  Предупреждение: nginx может раздавать старые файлы"
    echo "   Ожидалось: $NEW_HASH"
    echo "   Получено: $SERVED_HASH"
fi

echo ""
echo "🎉 Обновление завершено!"
echo ""
echo "⚠️  ВАЖНО: Очистите кеш браузера!"
echo ""
echo "   Chrome/Edge: Ctrl+Shift+Delete → Изображения и файлы в кеше → Очистить"
echo "   Firefox: Ctrl+Shift+Delete → Кеш → Очистить"
echo "   Или просто: Ctrl+F5 (жесткая перезагрузка)"
echo ""
echo "📍 Откройте: http://87.242.103.146"
echo "📝 В консоли должно быть:"
echo "   🔧 Production mode: using fixed API URL: http://87.242.103.146/api"
echo ""

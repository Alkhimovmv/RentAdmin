#!/bin/bash

# Скрипт для запуска RentAdmin на виртуальной машине
# Версия для VM с упрощенной архитектурой

echo "🚀 Запуск RentAdmin на виртуальной машине..."

# Остановка существующих контейнеров
echo "📦 Остановка существующих Docker контейнеров..."
docker-compose -f docker-compose.host.yml down 2>/dev/null || true

# Остановка backend если запущен
echo "🛑 Остановка backend процесса..."
pkill -f "node.*dist/server.js" 2>/dev/null || true
sleep 2

# Переход в директорию backend
cd backend

# Запуск backend в фоне
echo "⚙️  Запуск backend сервера..."
nohup npm start > /dev/null 2>&1 &
BACKEND_PID=$!

# Ожидание запуска backend
echo "⏳ Ожидание запуска backend..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Backend запущен успешно"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend не запустился за 30 секунд"
        exit 1
    fi
    sleep 1
done

# Возврат в основную директорию
cd ..

# Запуск nginx
echo "🌐 Запуск nginx..."
docker-compose -f docker-compose.host.yml up -d

# Проверка работоспособности
echo "🔍 Проверка работоспособности..."
sleep 3

# Проверка nginx
if ! docker ps | grep -q rentadmin_nginx; then
    echo "❌ Nginx контейнер не запущен"
    exit 1
fi

# Проверка доступности приложения
for i in {1..10}; do
    if curl -s http://localhost/health > /dev/null 2>&1; then
        echo "✅ Nginx работает"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Nginx не отвечает"
        exit 1
    fi
    sleep 1
done

# Проверка API
if curl -s http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ API работает"
else
    echo "❌ API не отвечает"
    exit 1
fi

# Проверка frontend
if curl -s http://localhost/ | grep -q "html"; then
    echo "✅ Frontend доступен"
else
    echo "❌ Frontend недоступен"
    exit 1
fi

echo ""
echo "🎉 RentAdmin успешно запущен!"
echo "📍 Приложение доступно по адресу: http://87.242.103.146"
echo "🔗 Локальный доступ: http://localhost"
echo "📊 Статус API: http://localhost/api/health"
echo ""
echo "📝 Для остановки используйте: ./stop-vm.sh"

# Сохранение PID backend процесса
echo $BACKEND_PID > backend.pid
echo "💾 Backend PID сохранен: $BACKEND_PID"
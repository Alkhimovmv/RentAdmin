#!/bin/bash

# Скрипт для полной очистки всех сервисов RentAdmin

echo "🧹 Полная очистка RentAdmin..."
echo "=============================="

# Остановка всех Docker контейнеров RentAdmin
echo "📦 Остановка всех Docker контейнеров..."
docker stop $(docker ps -aq --filter "name=rentadmin") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=rentadmin") 2>/dev/null || true

# Остановка через docker-compose
echo "📦 Остановка docker-compose сервисов..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.host.yml down 2>/dev/null || true

# Остановка всех Node.js процессов
echo "⚙️  Остановка всех Node.js процессов..."
pkill -f "node.*dist/server.js" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Освобождение портов
echo "🌐 Освобождение портов..."
if lsof -ti :80 >/dev/null 2>&1; then
    echo "Освобождаю порт 80..."
    lsof -ti :80 | xargs -r kill -9
fi

if lsof -ti :3001 >/dev/null 2>&1; then
    echo "Освобождаю порт 3001..."
    lsof -ti :3001 | xargs -r kill -9
fi

# Удаление PID файлов
echo "📄 Удаление PID файлов..."
rm -f backend.pid backend/backend.log

# Ожидание освобождения портов
echo "⏳ Ожидание освобождения портов..."
sleep 3

# Проверка результата
echo ""
echo "🔍 Проверка результата очистки:"
if lsof -i :80 >/dev/null 2>&1; then
    echo "⚠️  Порт 80 все еще занят"
    lsof -i :80
else
    echo "✅ Порт 80 свободен"
fi

if lsof -i :3001 >/dev/null 2>&1; then
    echo "⚠️  Порт 3001 все еще занят"
    lsof -i :3001
else
    echo "✅ Порт 3001 свободен"
fi

if docker ps | grep -q rentadmin; then
    echo "⚠️  Docker контейнеры RentAdmin все еще работают:"
    docker ps | grep rentadmin
else
    echo "✅ Все Docker контейнеры RentAdmin остановлены"
fi

echo ""
echo "✅ Очистка завершена!"
echo "📝 Теперь можно запустить: ./start-vm.sh"
#!/bin/bash

# Скрипт для ПОЛНОЙ остановки RentAdmin на VM
# В том числе отключение автозапуска Docker контейнеров
# Запускать НЕПОСРЕДСТВЕННО на виртуальной машине

echo "🛑 Полная остановка RentAdmin на VM..."
echo "======================================"
echo ""

# 1. Остановка Docker контейнеров
echo "1️⃣  Остановка Docker контейнеров..."
if docker ps -q --filter "name=rentadmin" | grep -q .; then
    docker-compose -f docker-compose.host.yml down
    echo "✅ Docker контейнеры остановлены"
else
    echo "ℹ️  Docker контейнеры уже остановлены"
fi

# 2. Отключение автозапуска контейнеров
echo ""
echo "2️⃣  Отключение автозапуска Docker контейнеров..."
CONTAINERS=$(docker ps -a -q --filter "name=rentadmin")
if [ ! -z "$CONTAINERS" ]; then
    docker update --restart=no $CONTAINERS
    echo "✅ Автозапуск отключен для всех контейнеров rentadmin"
else
    echo "ℹ️  Контейнеры не найдены"
fi

# 3. Удаление контейнеров (опционально)
echo ""
read -p "❓ Удалить контейнеры полностью? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ ! -z "$CONTAINERS" ]; then
        docker rm -f $CONTAINERS
        echo "✅ Контейнеры удалены"
    fi
fi

# 4. Остановка backend процесса
echo ""
echo "3️⃣  Остановка backend процесса..."
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✅ Backend остановлен (PID: $BACKEND_PID)"
    else
        echo "ℹ️  Backend процесс уже не активен"
    fi
    rm backend.pid
else
    # Альтернативный способ
    if pkill -f "node.*dist/server.js"; then
        echo "✅ Backend процессы остановлены"
    else
        echo "ℹ️  Backend процессы не найдены"
    fi
fi

# 5. Освобождение портов
echo ""
echo "4️⃣  Освобождение портов..."
PORTS_FREED=0

if lsof -ti :80 >/dev/null 2>&1; then
    lsof -ti :80 | xargs -r kill -9
    echo "✅ Порт 80 освобожден"
    PORTS_FREED=1
fi

if lsof -ti :3001 >/dev/null 2>&1; then
    lsof -ti :3001 | xargs -r kill -9
    echo "✅ Порт 3001 освобожден"
    PORTS_FREED=1
fi

if [ $PORTS_FREED -eq 0 ]; then
    echo "ℹ️  Все порты уже свободны"
fi

# 6. Проверка статуса
echo ""
echo "5️⃣  Проверка статуса..."
echo ""

# Проверка Docker
DOCKER_COUNT=$(docker ps --filter "name=rentadmin" | grep -c rentadmin || echo "0")
if [ "$DOCKER_COUNT" -eq "0" ]; then
    echo "✅ Docker контейнеры: остановлены"
else
    echo "⚠️  Docker контейнеры: $DOCKER_COUNT еще работают"
    docker ps --filter "name=rentadmin"
fi

# Проверка портов
PORT_80=$(lsof -ti :80 2>/dev/null | wc -l)
PORT_3001=$(lsof -ti :3001 2>/dev/null | wc -l)

if [ "$PORT_80" -eq "0" ]; then
    echo "✅ Порт 80: свободен"
else
    echo "⚠️  Порт 80: занят ($PORT_80 процессов)"
fi

if [ "$PORT_3001" -eq "0" ]; then
    echo "✅ Порт 3001: свободен"
else
    echo "⚠️  Порт 3001: занят ($PORT_3001 процессов)"
fi

# Проверка backend процесса
BACKEND_PROC=$(ps aux | grep -c "node.*dist/server.js" || echo "0")
if [ "$BACKEND_PROC" -le "1" ]; then  # 1 потому что сам grep тоже считается
    echo "✅ Backend процесс: остановлен"
else
    echo "⚠️  Backend процесс: еще работает"
    ps aux | grep "node.*dist/server.js" | grep -v grep
fi

echo ""
echo "🎉 Остановка завершена!"
echo ""
echo "📝 Примечания:"
echo "   - Docker контейнеры остановлены"
echo "   - Автозапуск Docker отключен"
echo "   - Backend процессы завершены"
echo "   - Порты освобождены"
echo ""
echo "ℹ️  После перезагрузки VM контейнеры НЕ запустятся автоматически"
echo ""

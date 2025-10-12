#!/bin/bash

# Скрипт для полного развертывания RentAdmin на VM
# И фронтенд, и бэкенд развернуты на VM (87.242.103.146)
# БЕЗ очистки базы данных

set -e  # Остановка при любой ошибке

echo "🚀 Полное развертывание RentAdmin на VM..."
echo "=========================================="
echo ""

# 1. Остановка процессов ТОЛЬКО RentAdmin
echo "🛑 Остановка процессов RentAdmin (безопасно, не трогает другие проекты)..."

# Получаем путь к проекту
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Останавливаем docker контейнеры
if docker ps -q --filter "name=rentadmin" | grep -q .; then
    echo "🐳 Останавливаем Docker контейнеры..."
    docker-compose -f docker-compose.host.yml down 2>/dev/null || true
fi

# Останавливаем backend процессы через PID файл
echo "🔴 Останавливаем backend процессы..."
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "Остановлен backend процесс (PID: $BACKEND_PID)"
        sleep 2
        # Принудительно если не остановился
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
    fi
    rm backend.pid
fi

# Останавливаем ТОЛЬКО процессы из директории RentAdmin
PIDS=$(ps aux | grep node | grep -E "(RentAdmin|rentadmin)" | grep -v grep | awk '{print $2}')
if [ ! -z "$PIDS" ]; then
    for PID in $PIDS; do
        PROCESS_CWD=$(readlink -f /proc/$PID/cwd 2>/dev/null || echo "")
        if [[ "$PROCESS_CWD" == *"RentAdmin"* ]] || [[ "$PROCESS_CWD" == *"rentadmin"* ]]; then
            echo "Остановка процесса $PID ($PROCESS_CWD)"
            kill $PID 2>/dev/null || true
        fi
    done
    sleep 2
    # Принудительно если не остановились
    for PID in $PIDS; do
        if ps -p $PID > /dev/null 2>&1; then
            PROCESS_CWD=$(readlink -f /proc/$PID/cwd 2>/dev/null || echo "")
            if [[ "$PROCESS_CWD" == *"RentAdmin"* ]] || [[ "$PROCESS_CWD" == *"rentadmin"* ]]; then
                kill -9 $PID 2>/dev/null || true
            fi
        fi
    done
fi

# Освобождаем порт 3001 ТОЛЬКО если это RentAdmin
if command -v lsof &> /dev/null && lsof -ti :3001 >/dev/null 2>&1; then
    PROCESS_ON_3001=$(lsof -ti :3001)
    PROCESS_PATH=$(readlink -f /proc/$PROCESS_ON_3001/cwd 2>/dev/null || echo "")
    if [[ "$PROCESS_PATH" == *"RentAdmin"* ]]; then
        echo "Освобождаем порт 3001 (RentAdmin)..."
        kill -9 $PROCESS_ON_3001 2>/dev/null || true
    else
        echo "ℹ️  Порт 3001 используется другим проектом, не трогаем"
    fi
fi

echo "✅ Процессы RentAdmin остановлены (VozmiMenja продолжает работать)"
echo ""

# 2. Полная пересборка backend
echo "🔧 Пересборка backend..."
cd backend

# Удаляем старую сборку
rm -rf dist/
echo "🗑️  Старая сборка удалена"

# Проверка и установка зависимостей
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей backend..."
    npm install
fi

# Сборка
echo "🔨 Сборка backend..."
if npm run build; then
    if [ -f "dist/server.js" ]; then
        echo "✅ Backend собран успешно"
        echo "📊 Размер: $(stat -c%s dist/server.js) байт"
    else
        echo "❌ Файл dist/server.js не создан"
        exit 1
    fi
else
    echo "❌ Ошибка сборки backend"
    exit 1
fi

cd ..
echo ""

# 3. Полная пересборка frontend
echo "🌐 Пересборка frontend..."
cd frontend

# Удаляем старую сборку
rm -rf dist/
echo "🗑️  Старая сборка frontend удалена"

# Проверка и установка зависимостей
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей frontend..."
    npm install
fi

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
echo ""

# 4. Запуск backend
echo "⚙️  Запуск backend сервера..."
cd backend

# Проверка базы данных
if [ -f "dev.sqlite3" ]; then
    echo "💾 База данных найдена (размер: $(stat -c%s dev.sqlite3) байт)"
else
    echo "ℹ️  База данных будет создана при первом запуске"
fi

# Запуск в фоне с production окружением
NODE_ENV=production nohup npm start > backend.log 2>&1 &
NPM_PID=$!

# Ожидание запуска
echo "⏳ Ожидание запуска backend..."
sleep 3

# Проверка запуска
for i in {1..30}; do
    if curl -s --max-time 2 http://localhost:3001/api/health > /dev/null 2>&1; then
        BACKEND_PID=$(lsof -ti :3001)
        echo "✅ Backend запущен успешно (PID: $BACKEND_PID)"
        echo $BACKEND_PID > ../backend.pid
        break
    fi

    if [ $i -eq 30 ]; then
        echo "❌ Backend не запустился за 30 секунд"
        echo "📋 Логи backend:"
        tail -20 backend.log
        exit 1
    fi
    sleep 1
done

cd ..
echo ""

# 5. Запуск nginx на VM
echo "🐳 Запуск nginx для VM..."
docker-compose -f docker-compose.host.yml up -d

# Ожидание запуска nginx
echo "⏳ Ожидание запуска nginx..."
sleep 2

# Проверка nginx с повторными попытками
NGINX_READY=0
for i in {1..10}; do
    if docker ps --filter "name=rentadmin_nginx" --filter "status=running" | grep -q rentadmin_nginx; then
        NGINX_READY=1
        echo "✅ Nginx запущен"
        break
    fi
    sleep 1
done

if [ $NGINX_READY -eq 0 ]; then
    echo "❌ Nginx не запустился за 10 секунд"
    echo "📋 Логи Docker:"
    docker logs rentadmin_nginx --tail 20
    exit 1
fi

echo ""

# 6. Проверка работоспособности
echo "🔍 Проверка работоспособности системы..."
echo ""

# Проверка health endpoint
echo "1️⃣  Проверка health endpoint..."
if curl -s http://localhost:8080/health | grep -q "healthy"; then
    echo "   ✅ Health endpoint работает"
else
    echo "   ❌ Health endpoint не отвечает"
fi

# Проверка API
echo "2️⃣  Проверка API..."
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "   ✅ API доступен"
else
    echo "   ❌ API недоступен"
fi

# Проверка frontend
echo "3️⃣  Проверка frontend..."
if curl -s http://localhost:8080/ | grep -q "html"; then
    echo "   ✅ Frontend доступен"
else
    echo "   ❌ Frontend недоступен"
fi

echo ""
echo "🎉 Развертывание завершено успешно!"
echo "=================================="
echo ""
echo "📍 Доступ к приложению:"
echo "   🌐 VM адрес: http://87.242.103.146:8080"
echo "   🏠 Локальный адрес: http://localhost:8080"
echo ""
echo "📊 Статус компонентов:"
echo "   Backend: http://87.242.103.146:8080/api/health"
echo "   Frontend: http://87.242.103.146:8080"
echo "   Nginx: работает через Docker (порт 8080)"
echo ""
echo "ℹ️  Порты на сервере:"
echo "   VozmiMenja: http://87.242.103.146 (порт 80)"
echo "   RentAdmin: http://87.242.103.146:8080 (порт 8080)"
echo ""
echo "📝 Управление:"
echo "   Логи backend: tail -f backend/backend.log"
echo "   Остановка: ./stop-rentadmin.sh"
echo "   Перезапуск: ./restart-vm.sh"
echo "   Обновление фронтенда: ./quick-frontend-update.sh"
echo ""
echo "💡 База данных сохраняется при перезапуске"
echo ""

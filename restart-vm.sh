#!/bin/bash

# Скрипт для полного перезапуска RentAdmin на виртуальной машине
# Убивает все процессы, пересобирает проект и запускает заново
# База данных НЕ очищается

echo "🔄 Полный перезапуск RentAdmin на виртуальной машине..."
echo "================================================================"
echo "⚠️  ВНИМАНИЕ: Все процессы будут остановлены и запущены заново"
echo "💾 База данных сохраняется и НЕ будет очищена"
echo "================================================================"
echo ""

# 1. Остановка всех процессов
echo "🛑 Шаг 1/5: Остановка всех процессов..."

# Остановка nginx контейнера
echo "   - Остановка nginx контейнера..."
docker-compose -f docker-compose.host.yml down 2>/dev/null || true

# Остановка backend процессов ТОЛЬКО из RentAdmin
echo "   - Остановка backend процессов RentAdmin..."

# Получаем путь к проекту
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "   - Остановка процесса по PID: $BACKEND_PID"
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2
        # Если не убился - принудительно
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
    fi
    rm backend.pid
fi

# Остановка процессов ТОЛЬКО из директории RentAdmin
ps aux | grep node | grep "$PROJECT_DIR" | grep -v grep | awk '{print $2}' | xargs -r kill 2>/dev/null || true
sleep 2
ps aux | grep node | grep "$PROJECT_DIR" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true

# Освобождение порта 3001 ТОЛЬКО если это процесс RentAdmin
if lsof -i :3001 > /dev/null 2>&1; then
    PROCESS_ON_3001=$(lsof -ti :3001)
    PROCESS_PATH=$(readlink -f /proc/$PROCESS_ON_3001/cwd 2>/dev/null || echo "")

    if [[ "$PROCESS_PATH" == *"RentAdmin"* ]]; then
        echo "   - Освобождение порта 3001 (RentAdmin процесс)..."
        kill -9 $PROCESS_ON_3001 2>/dev/null || true
    else
        echo "   ⚠️  Порт 3001 занят другим проектом ($PROCESS_PATH), пропускаем"
    fi
fi

sleep 3
echo "✅ Все процессы остановлены"
echo ""

# 2. Пересборка backend
echo "🔧 Шаг 2/5: Пересборка backend..."
cd backend

# Удаляем старую сборку
rm -rf dist/

# Собираем backend
if npm run build; then
    if [ -f "dist/server.js" ]; then
        echo "✅ Backend собран успешно"
    else
        echo "❌ Ошибка: dist/server.js не создан"
        exit 1
    fi
else
    echo "❌ Ошибка сборки backend"
    exit 1
fi

cd ..
echo ""

# 3. Пересборка frontend
echo "🌐 Шаг 3/5: Пересборка frontend..."
cd frontend

# Удаляем старую сборку
rm -rf dist/

# Собираем frontend
if npm run build; then
    if [ -f "dist/index.html" ]; then
        echo "✅ Frontend собран успешно"
    else
        echo "❌ Ошибка: dist/index.html не создан"
        exit 1
    fi
else
    echo "❌ Ошибка сборки frontend"
    exit 1
fi

cd ..
echo ""

# 4. Запуск backend
echo "⚙️  Шаг 4/5: Запуск backend сервера..."
cd backend

# Установка зависимостей
npm install > /dev/null 2>&1

# Запуск backend в фоне
nohup npm start > backend.log 2>&1 &
NPM_PID=$!

# Ждём немного
sleep 3

# Ожидание запуска backend
echo "   - Ожидание запуска backend..."
for i in {1..30}; do
    if lsof -i :3001 > /dev/null 2>&1 && curl -s --max-time 2 http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Backend запущен успешно"
        BACKEND_PID=$(lsof -ti :3001 2>/dev/null || echo "")
        if [ -n "$BACKEND_PID" ]; then
            echo $BACKEND_PID > ../backend.pid
        fi
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend не запустился за 30 секунд"
        echo "📋 Последние строки лога:"
        tail -20 backend.log
        exit 1
    fi
    sleep 1
done

cd ..
echo ""

# 5. Запуск nginx
echo "🌐 Шаг 5/5: Запуск nginx..."
docker-compose -f docker-compose.host.yml up -d

sleep 3

# Проверка nginx
if ! docker ps | grep -q rentadmin_nginx; then
    echo "❌ Nginx контейнер не запущен"
    exit 1
fi

echo "✅ Nginx запущен успешно"
echo ""

# Финальная проверка
echo "🔍 Проверка работоспособности..."

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
echo "================================================================"
echo "🎉 RentAdmin успешно перезапущен!"
echo "================================================================"
echo ""
echo "📍 Приложение доступно:"
echo "   🌐 Внешний доступ: http://87.242.103.146"
echo "   🏠 Локальный доступ: http://localhost"
echo "   📊 Статус API: http://localhost/api/health"
echo ""
echo "📝 Команды управления:"
echo "   ./stop-vm.sh    - остановка приложения"
echo "   ./start-vm.sh   - обычный запуск (без пересборки)"
echo "   ./restart-vm.sh - полная пересборка и перезапуск"
echo ""
echo "💡 Обновите страницу в браузере (Ctrl+F5)"
echo "================================================================"

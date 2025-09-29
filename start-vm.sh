#!/bin/bash

# Скрипт для запуска RentAdmin на виртуальной машине
# Версия для VM с упрощенной архитектурой

echo "🚀 Запуск RentAdmin на виртуальной машине..."

# Мягкая очистка только процессов (БЕЗ очистки данных)
echo "🔄 Остановка существующих процессов..."
echo "💾 База данных и данные НЕ очищаются - они сохраняются!"

# Остановка backend если запущен
echo "🛑 Остановка backend процесса..."
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "🔄 Остановлен backend процесс (PID: $BACKEND_PID)"
        sleep 2
    fi
    rm backend.pid
fi

# Дополнительная очистка
pkill -f "node.*dist/server.js" 2>/dev/null || true
sleep 3

# Проверяем, что порт 3001 свободен
if lsof -i :3001 > /dev/null 2>&1; then
    echo "⚠️  Порт 3001 всё ещё занят, принудительно освобождаем..."
    lsof -ti :3001 | xargs -r kill -9
    sleep 2
fi

# Проверка и сборка frontend
echo "🌐 Проверка frontend..."
cd frontend
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "📦 Сборка frontend (папка dist не найдена или неполная)..."
    npm install
    if npm run build; then
        if [ -f "dist/index.html" ]; then
            echo "✅ Frontend собран успешно"
        else
            echo "❌ Сборка frontend завершилась, но файл dist/index.html не создан"
            exit 1
        fi
    else
        echo "❌ Сборка frontend завершилась с ошибками"
        exit 1
    fi
else
    echo "✅ Frontend уже собран"
fi

cd ..

# Переход в директорию backend
cd backend

# Проверка и пересборка backend при необходимости
echo "🔧 Проверка backend сборки..."
if [ ! -f "dist/server.js" ]; then
    echo "🗑️  Backend не собран, выполняем сборку..."
    rm -rf dist/

    echo "📦 Сборка backend..."
    if npm run build; then
        if [ -f "dist/server.js" ]; then
            echo "✅ Backend собран успешно"
            echo "📊 Размер dist/server.js: $(stat -c%s dist/server.js) байт"
            echo "📅 Дата сборки: $(date)"
        else
            echo "❌ Сборка завершилась, но файл dist/server.js не создан"
            echo "📋 Содержимое папки dist:"
            ls -la dist/ 2>/dev/null || echo "Папка dist не существует"
            exit 1
        fi
    else
        echo "❌ Сборка backend завершилась с ошибками"
        exit 1
    fi
else
    echo "✅ Backend уже собран, пропускаем пересборку"
fi

# Проверка зависимостей
echo "📦 Установка зависимостей..."
npm install

# Проверка базы данных
echo "💾 Проверка базы данных..."
if [ -f "dev.sqlite3" ]; then
    DB_SIZE=$(stat -c%s dev.sqlite3)
    echo "✅ База данных существует (размер: $DB_SIZE байт)"
else
    echo "ℹ️  База данных отсутствует - будет создана при первом запуске"
fi

# Запуск backend в фоне
echo "⚙️  Запуск backend сервера..."
nohup npm start > backend.log 2>&1 &
NPM_PID=$!

# Ждём немного, чтобы npm запустил node процесс
sleep 3

# Находим PID node процесса
BACKEND_PID=$(lsof -ti :3001 2>/dev/null || echo "")

# Ожидание запуска backend
echo "⏳ Ожидание запуска backend..."
for i in {1..30}; do
    # Проверяем, что процесс запущен и порт открыт
    if lsof -i :3001 > /dev/null 2>&1 && curl -s --max-time 2 http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Backend запущен успешно"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend не запустился за 30 секунд"
        echo "🔍 Проверяем процессы на порту 3001:"
        lsof -i :3001 || echo "Порт 3001 не используется"
        echo "🔍 Проверяем логи backend:"
        echo "Текущая директория: $(pwd)"
        echo "Пользователь: $(whoami)"
        echo "Домашняя директория: $HOME"
        if [ -f backend.log ]; then
            echo "--- Последние 10 строк backend.log ---"
            tail -10 backend.log
        else
            echo "Лог файл backend.log не найден"
        fi
        echo "Проверка файла dist/server.js:"
        if [ -f "dist/server.js" ]; then
            echo "✅ Файл dist/server.js существует"
            ls -la dist/server.js
        else
            echo "❌ Файл dist/server.js не найден"
            echo "Содержимое директории dist:"
            ls -la dist/ 2>/dev/null || echo "Директория dist не существует"
        fi
        echo "🔍 Проверяем npm процесс:"
        if kill -0 $NPM_PID 2>/dev/null; then
            echo "NPM процесс (PID: $NPM_PID) ещё работает"
        else
            echo "NPM процесс (PID: $NPM_PID) завершился"
        fi
        echo "🔍 Пробуем подключиться к health check:"
        curl -v http://localhost:3001/api/health || echo "Health check недоступен"
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
if [ -n "$BACKEND_PID" ]; then
    echo $BACKEND_PID > ../backend.pid
    echo "💾 Backend PID сохранен: $BACKEND_PID"
else
    echo "⚠️  Не удалось определить PID backend процесса"
fi
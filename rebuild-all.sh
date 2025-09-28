#!/bin/bash

# Скрипт полной пересборки RentAdmin для виртуальной машины

echo "🔨 Полная пересборка RentAdmin..."
echo "================================="

# Информация о системе
echo "📍 Текущая директория: $(pwd)"
echo "👤 Пользователь: $(whoami)"
echo "🏠 Домашняя директория: $HOME"
echo "🕒 Время: $(date)"

echo ""

# Полная очистка
echo "🧹 Полная очистка..."
if [ -f clean-all.sh ]; then
    ./clean-all.sh
else
    echo "⚠️  clean-all.sh не найден, выполняю базовую очистку"
    pkill -f "node.*dist/server.js" 2>/dev/null || true
    docker-compose down 2>/dev/null || true
fi

echo ""

# Пересборка frontend
echo "🌐 Пересборка frontend..."
cd frontend

echo "🗑️  Очистка старой сборки frontend..."
rm -rf dist/

echo "📦 Установка зависимостей frontend..."
npm install

echo "🔧 Сборка frontend..."
if npm run build; then
    if [ -f "dist/index.html" ]; then
        echo "✅ Frontend собран успешно"
        echo "📊 Размер dist/index.html: $(stat -c%s dist/index.html) байт"
    else
        echo "❌ Frontend не собрался корректно"
        exit 1
    fi
else
    echo "❌ Ошибка сборки frontend"
    exit 1
fi

cd ..

echo ""

# Пересборка backend
echo "⚙️  Пересборка backend..."
cd backend

echo "🗑️  Очистка старой сборки backend..."
rm -rf dist/

echo "📦 Установка зависимостей backend..."
npm install

echo "🔧 Сборка backend..."
if npm run build; then
    if [ -f "dist/server.js" ]; then
        echo "✅ Backend собран успешно"
        echo "📊 Размер dist/server.js: $(stat -c%s dist/server.js) байт"

        # Проверка структуры
        echo "📋 Структура dist:"
        ls -la dist/

        # Быстрый тест запуска
        echo ""
        echo "🧪 Тестирование запуска backend..."
        timeout 5s node dist/server.js &
        BACKEND_PID=$!
        sleep 2

        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "✅ Backend тест прошел успешно"
            kill $BACKEND_PID 2>/dev/null
        else
            echo "❌ Backend тест не прошел"
            echo "📋 Проверим зависимости:"
            echo "routes/auth.js: $([ -f "dist/routes/auth.js" ] && echo "✅" || echo "❌")"
            echo "routes/equipment.js: $([ -f "dist/routes/equipment.js" ] && echo "✅" || echo "❌")"
            echo "routes/rentals.js: $([ -f "dist/routes/rentals.js" ] && echo "✅" || echo "❌")"
        fi
    else
        echo "❌ Backend не собрался корректно"
        echo "📋 Содержимое папки dist:"
        ls -la dist/ 2>/dev/null || echo "Папка dist не существует"
        exit 1
    fi
else
    echo "❌ Ошибка сборки backend"
    exit 1
fi

cd ..

echo ""
echo "🎉 Полная пересборка завершена!"
echo "📝 Теперь можно запустить: ./start-vm.sh"
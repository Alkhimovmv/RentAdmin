#!/bin/bash

# Быстрая проверка готовности RentAdmin к запуску

echo "🔍 Проверка готовности RentAdmin к запуску..."
echo "============================================"

# Проверка зависимостей системы
echo "📋 Проверка системных зависимостей:"
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js не установлен"
    exit 1
fi

if command -v npm >/dev/null 2>&1; then
    echo "✅ NPM: $(npm --version)"
else
    echo "❌ NPM не установлен"
    exit 1
fi

if command -v docker >/dev/null 2>&1; then
    echo "✅ Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
else
    echo "❌ Docker не установлен"
    exit 1
fi

echo ""

# Проверка структуры проекта
echo "📁 Проверка структуры проекта:"
if [ -d "backend" ]; then
    echo "✅ Папка backend найдена"
else
    echo "❌ Папка backend не найдена"
    exit 1
fi

if [ -d "frontend" ]; then
    echo "✅ Папка frontend найдена"
else
    echo "❌ Папка frontend не найдена"
    exit 1
fi

if [ -f "docker-compose.host.yml" ]; then
    echo "✅ Конфигурация Docker Compose найдена"
else
    echo "❌ Файл docker-compose.host.yml не найден"
    exit 1
fi

echo ""

# Проверка зависимостей backend
echo "📦 Проверка зависимостей backend:"
cd backend
if [ -f "package.json" ]; then
    echo "✅ package.json найден"
else
    echo "❌ package.json не найден"
    exit 1
fi

if [ -d "node_modules" ]; then
    echo "✅ node_modules установлены"
else
    echo "⚠️  node_modules не найдены - будут установлены при запуске"
fi

if [ -f "tsconfig.json" ]; then
    echo "✅ TypeScript конфигурация найдена"
else
    echo "❌ tsconfig.json не найден"
    exit 1
fi

echo ""

# Проверка сборки backend
echo "🔧 Проверка сборки backend:"
if [ -f "dist/server.js" ]; then
    echo "✅ Backend собран (dist/server.js существует)"
else
    echo "⚠️  Backend не собран - будет собран при запуске"
fi

cd ..

# Проверка frontend
echo "🌐 Проверка frontend:"
if [ -d "frontend/dist" ]; then
    echo "✅ Frontend собран (папка dist найдена)"
    if [ -f "frontend/dist/index.html" ]; then
        echo "✅ index.html найден"
    else
        echo "❌ index.html не найден в frontend/dist"
        echo "⚠️  Запустите: cd frontend && npm run build"
        exit 1
    fi
else
    echo "⚠️  Frontend не собран (папка frontend/dist не найдена)"
    echo "⚠️  Будет собран автоматически при запуске ./start-vm.sh"
fi

echo ""

# Проверка портов
echo "🌐 Проверка доступности портов:"
if lsof -i :80 >/dev/null 2>&1; then
    echo "⚠️  Порт 80 занят - может потребоваться остановка существующих сервисов"
else
    echo "✅ Порт 80 свободен"
fi

if lsof -i :3001 >/dev/null 2>&1; then
    echo "⚠️  Порт 3001 занят - может потребоваться остановка существующих сервисов"
else
    echo "✅ Порт 3001 свободен"
fi

echo ""
echo "🎉 Проверка завершена! RentAdmin готов к запуску."
echo "📝 Используйте './start-vm.sh' для запуска приложения"
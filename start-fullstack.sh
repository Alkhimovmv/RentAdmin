#!/bin/bash

# Запуск полного стека RentAdmin локально
echo "🚀 Запуск полного стека RentAdmin"
echo "================================="
echo ""

# Проверяем что PostgreSQL установлен
if ! command -v psql &> /dev/null; then
    echo "📦 Установка PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi

# Проверяем статус PostgreSQL
echo "🔍 Проверка PostgreSQL..."
if sudo systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL работает"
else
    echo "🔄 Запуск PostgreSQL..."
    sudo systemctl start postgresql
fi

# Создаем базу данных и пользователя
echo "🗄️ Настройка базы данных..."
sudo -u postgres psql <<EOF
-- Создаем пользователя если не существует
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
        CREATE USER postgres WITH PASSWORD 'password';
    END IF;
END
\$\$;

-- Даем права суперпользователя
ALTER USER postgres CREATEDB SUPERUSER;

-- Создаем базу данных если не существует
SELECT 'CREATE DATABASE rent_admin'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rent_admin')\gexec
EOF

echo "✅ База данных настроена"

# Переходим в директорию бэкенда
cd backend

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей бэкенда..."
    npm install
fi

# Собираем бэкенд
echo "🔨 Сборка бэкенда..."
npm run build

# Запускаем миграции
echo "📊 Запуск миграций базы данных..."
DB_HOST=localhost DB_PORT=5432 DB_NAME=rent_admin DB_USER=postgres DB_PASSWORD=password npm run db:migrate

# Запускаем бэкенд в фоне
echo "🎯 Запуск бэкенда..."
DB_HOST=localhost DB_PORT=5432 DB_NAME=rent_admin DB_USER=postgres DB_PASSWORD=password JWT_SECRET=super-secret-jwt-key-for-rent-admin-2024 PIN_CODE=20031997 CORS_ORIGIN="*" NODE_ENV=development PORT=3001 npm start &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid

echo "✅ Бэкенд запущен (PID: $BACKEND_PID)"

# Переходим в корневую директорию
cd ..

# Ждем запуска бэкенда
echo "⏳ Ожидание запуска бэкенда..."
sleep 5

# Проверяем бэкенд
for i in {1..10}; do
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo "✅ Бэкенд готов к работе"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Бэкенд не запустился"
        exit 1
    fi
    sleep 2
    echo -n "."
done

# Переходим во фронтенд
cd frontend

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей фронтенда..."
    npm install
fi

# Обновляем конфигурацию API для локального бэкенда
echo "🔧 Настройка API для локального бэкенда..."

# Создаем файл конфигурации с локальным API
cat > src/config/api.config.js << 'EOL'
// Автоматически сгенерированная конфигурация для локального бэкенда
const LOCAL_IP = window.location.hostname;

export const API_CONFIG = {
  baseURL: `http://${LOCAL_IP}:3001/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

export const API_SERVERS = [
  {
    name: 'Local Backend',
    url: `http://${LOCAL_IP}:3001/api`,
    isDefault: true
  }
];
EOL

echo "✅ API настроено на http://localhost:3001/api"

# Собираем фронтенд
echo "🔨 Сборка фронтенда..."
npm run build

echo ""
echo "🎉 ПОЛНЫЙ СТЕК ЗАПУЩЕН!"
echo ""
echo "📋 ДОСТУПНЫЕ АДРЕСА:"
echo "🎯 Бэкенд API: http://localhost:3001/api"
echo "🌐 Фронтенд: http://localhost:3000/"
echo ""
echo "🔧 УПРАВЛЕНИЕ:"
echo "⏹️ Остановка бэкенда: kill \$(cat backend.pid)"
echo "📊 Логи бэкенда: tail -f backend/logs/app.log"
echo "🔄 Перезапуск: ./start-fullstack.sh"
echo ""

# Запускаем локальный сервер фронтенда
echo "🌐 Запуск фронтенда..."
cd ..

# Создаем простой HTTP сервер для фронтенда
node -e "
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from frontend/dist
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Handle React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Frontend server running on http://localhost:\${PORT}\`);
});
" &

FRONTEND_PID=$!
echo $FRONTEND_PID > frontend.pid

echo "✅ Фронтенд запущен (PID: $FRONTEND_PID)"
echo ""
echo "🚀 Все готово! Откройте http://localhost:3000/ в браузере"
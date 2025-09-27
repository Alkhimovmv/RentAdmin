#!/bin/bash

# ===========================================
# Экстренный запуск простого API сервера
# БЕЗ Docker, БЕЗ базы данных
# ===========================================

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log "🚀 Запуск экстренного API сервера для RentAdmin"

# Проверить что мы в правильной папке
if [ ! -f "simple-server.js" ]; then
    error "Файл simple-server.js не найден!"
    error "Запустите скрипт из папки RentAdmin"
    exit 1
fi

# Проверить Node.js
if ! command -v node &> /dev/null; then
    error "Node.js не установлен!"

    warning "Устанавливаем Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs

    if ! command -v node &> /dev/null; then
        error "Не удалось установить Node.js"
        exit 1
    fi
fi

# Показать версию Node.js
NODE_VERSION=$(node --version)
log "Node.js версия: $NODE_VERSION"

# Проверить зависимости
if [ ! -d "node_modules" ]; then
    warning "Папка node_modules не найдена"

    if [ ! -f "package.json" ]; then
        warning "Создаем минимальный package.json..."
        cat > package.json << EOF
{
  "name": "rentadmin-simple",
  "version": "1.0.0",
  "description": "Простой API сервер для RentAdmin",
  "main": "simple-server.js",
  "scripts": {
    "start": "node simple-server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF
    fi

    log "Устанавливаем зависимости..."
    npm install --only=production
fi

# Остановить процессы на порту 3001 если есть
info "Проверяем порт 3001..."
if lsof -ti:3001 > /dev/null 2>&1; then
    warning "Порт 3001 занят, останавливаем процессы..."
    sudo pkill -f "node.*3001" || true
    sudo fuser -k 3001/tcp || true
    sleep 2
fi

# Открыть порт в firewall
info "Открываем порт 3001 в firewall..."
sudo ufw allow 3001/tcp || true

# Сделать файл исполняемым
chmod +x simple-server.js

# Запустить сервер
log "🎯 Запускаем простой API сервер на порту 3001..."

# Запуск в фоне с логированием
nohup node simple-server.js > simple-server.log 2>&1 &
SERVER_PID=$!

echo $SERVER_PID > simple-server.pid

log "✅ Сервер запущен!"
info "PID процесса: $SERVER_PID"
info "Логи: tail -f simple-server.log"

# Ждем 3 секунды для запуска
sleep 3

# Тестируем сервер
log "🔍 Тестируем сервер..."

if curl -s http://localhost:3001/api/health > /dev/null; then
    log "✅ Локальный тест прошел успешно!"

    info "API endpoints доступны:"
    echo "  • Health: http://87.242.103.146:3001/api/health"
    echo "  • Root: http://87.242.103.146:3001/"
    echo "  • Login: POST http://87.242.103.146:3001/api/auth/login"
    echo "  • Equipment: http://87.242.103.146:3001/api/equipment"

    # Тест извне
    warning "Тестируем доступность извне..."
    if curl -s --max-time 5 http://87.242.103.146:3001/api/health > /dev/null; then
        log "🎉 УСПЕХ! Сервер доступен извне!"
    else
        warning "Сервер запущен локально, но может быть недоступен извне"
        warning "Проверьте firewall: sudo ufw allow 3001/tcp"
    fi

else
    error "❌ Сервер не отвечает локально"
    error "Проверьте логи: tail -f simple-server.log"
    exit 1
fi

log "📋 Управление сервером:"
echo "  • Остановить: kill $SERVER_PID"
echo "  • Перезапустить: ./start-simple-server.sh"
echo "  • Логи: tail -f simple-server.log"
echo "  • Статус: ps aux | grep simple-server"

log "🌐 Обновите VITE_API_URL в Netlify на:"
info "https://87.242.103.146:3001/api"

log "✨ Готово! Простой API сервер работает!"
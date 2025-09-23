#!/bin/bash

# ===========================================
# Перезапуск сервера после исправления ошибки
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

log "🔄 Перезапуск исправленного Node.js сервера"

# Остановить все запущенные серверы
warning "Останавливаем все активные серверы..."
sudo pkill -f "node.*simple-server" || true
sudo pkill -f "python.*test-server" || true

# Освободить порты
warning "Освобождаем порты..."
sudo fuser -k 3001/tcp || true
sudo fuser -k 8080/tcp || true

sleep 2

# Запустить исправленный сервер
log "🚀 Запускаем исправленный Node.js сервер..."

nohup node simple-server.js > simple-server.log 2>&1 &
SERVER_PID=$!

echo $SERVER_PID > simple-server.pid

log "✅ Сервер запущен с PID: $SERVER_PID"

# Ждем запуска
sleep 3

# Тестируем
log "🔍 Тестируем исправленный сервер..."

if curl -s http://localhost:3001/api/health > /dev/null; then
    log "✅ Локальный тест успешен!"

    # Показать ответ сервера
    log "📋 Ответ сервера:"
    curl -s http://localhost:3001/api/health | jq . || curl -s http://localhost:3001/api/health

    echo ""
    info "🌐 Сервер доступен по адресам:"
    echo "  • Local: http://localhost:3001/api/health"
    echo "  • Remote: http://87.242.103.146:3001/api/health"

else
    error "❌ Сервер все еще не отвечает!"
    error "Проверьте логи: tail -f simple-server.log"
    exit 1
fi

log "✨ Перезапуск завершен успешно!"
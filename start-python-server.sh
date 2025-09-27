#!/bin/bash

# ===========================================
# Экстренный запуск Python API сервера
# БЕЗ зависимостей, только встроенные модули
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

log "🐍 Запуск экстренного Python API сервера для RentAdmin"

# Проверить что мы в правильной папке
if [ ! -f "test-server.py" ]; then
    error "Файл test-server.py не найден!"
    error "Запустите скрипт из папки RentAdmin"
    exit 1
fi

# Проверить Python
if ! command -v python3 &> /dev/null; then
    error "Python3 не установлен!"

    warning "Устанавливаем Python3..."
    sudo apt-get update
    sudo apt-get install -y python3

    if ! command -v python3 &> /dev/null; then
        error "Не удалось установить Python3"
        exit 1
    fi
fi

# Показать версию Python
PYTHON_VERSION=$(python3 --version)
log "Python версия: $PYTHON_VERSION"

# Остановить процессы на порту 8080 если есть
info "Проверяем порт 8080..."
if lsof -ti:8080 > /dev/null 2>&1; then
    warning "Порт 8080 занят, останавливаем процессы..."
    sudo pkill -f "python.*8080" || true
    sudo pkill -f "test-server.py" || true
    sudo fuser -k 8080/tcp || true
    sleep 2
fi

# Открыть порт в firewall
info "Открываем порт 8080 в firewall..."
sudo ufw allow 8080/tcp || true

# Сделать файл исполняемым
chmod +x test-server.py

# Запустить сервер
log "🎯 Запускаем Python API сервер на порту 8080..."

# Запуск в фоне с логированием
nohup python3 test-server.py > python-server.log 2>&1 &
SERVER_PID=$!

echo $SERVER_PID > python-server.pid

log "✅ Python сервер запущен!"
info "PID процесса: $SERVER_PID"
info "Логи: tail -f python-server.log"

# Ждем 3 секунды для запуска
sleep 3

# Тестируем сервер
log "🔍 Тестируем Python сервер..."

if curl -s http://localhost:8080/api/health > /dev/null; then
    log "✅ Локальный тест прошел успешно!"

    info "API endpoints доступны:"
    echo "  • Health: http://87.242.103.146:8080/api/health"
    echo "  • Root: http://87.242.103.146:8080/"
    echo "  • Login: POST http://87.242.103.146:8080/api/auth/login"
    echo "  • Equipment: http://87.242.103.146:8080/api/equipment"

    # Тест извне
    warning "Тестируем доступность извне..."
    if curl -s --max-time 5 http://87.242.103.146:8080/api/health > /dev/null; then
        log "🎉 УСПЕХ! Python сервер доступен извне!"
    else
        warning "Сервер запущен локально, но может быть недоступен извне"
        warning "Проверьте firewall: sudo ufw allow 8080/tcp"
    fi

else
    error "❌ Python сервер не отвечает локально"
    error "Проверьте логи: tail -f python-server.log"
    exit 1
fi

log "📋 Управление Python сервером:"
echo "  • Остановить: kill $SERVER_PID"
echo "  • Перезапустить: ./start-python-server.sh"
echo "  • Логи: tail -f python-server.log"
echo "  • Статус: ps aux | grep test-server"

log "🌐 Обновите VITE_API_URL в Netlify на:"
info "https://87.242.103.146:8080/api"

log "✨ Готово! Python API сервер работает!"
#!/bin/bash

# ==========================================
# Скрипт быстрого обновления RentAdmin
# ==========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

PROJECT_DIR="/opt/rentadmin"

log "🔄 Обновление RentAdmin..."

# Переход в директорию проекта
cd $PROJECT_DIR

# Остановка приложения
log "Остановка приложения..."
docker-compose down

# Обновление кода (если используется git)
if [ -d ".git" ]; then
    log "Обновление кода из репозитория..."
    git pull origin main
fi

# Сборка frontend
log "Пересборка frontend..."
cd frontend
npm ci
VITE_API_URL=http://87.242.103.146/api npm run build
cd ..

# Запуск приложения
log "Запуск обновленного приложения..."
docker-compose up --build -d

# Проверка статуса
log "Проверка статуса..."
sleep 10
docker-compose ps

log "✅ Обновление завершено!"
log "🌐 Приложение доступно: http://87.242.103.146"
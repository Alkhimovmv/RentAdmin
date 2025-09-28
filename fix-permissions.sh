#!/bin/bash

# ==========================================
# Скрипт исправления прав доступа
# Для решения проблем с node_modules
# ==========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

fix_permissions() {
    log "🔧 Исправление прав доступа в /opt/rentadmin..."

    PROJECT_DIR="/opt/rentadmin"

    if [ ! -d "$PROJECT_DIR" ]; then
        error "Директория $PROJECT_DIR не найдена!"
    fi

    cd $PROJECT_DIR

    # Исправление прав на всю директорию проекта
    log "Исправление прав на директорию проекта..."
    sudo chown -R $USER:$USER .

    # Исправление прав на .git если существует
    if [ -d ".git" ]; then
        log "Исправление прав на .git..."
        sudo chown -R $USER:$USER .git
        git config --global --add safe.directory $PROJECT_DIR
    fi

    # Очистка node_modules в frontend
    if [ -d "frontend/node_modules" ]; then
        log "Очистка frontend/node_modules..."
        sudo rm -rf frontend/node_modules
        sudo rm -f frontend/package-lock.json
    fi

    # Очистка node_modules в backend
    if [ -d "backend/node_modules" ]; then
        log "Очистка backend/node_modules..."
        sudo rm -rf backend/node_modules
        sudo rm -f backend/package-lock.json
    fi

    # Исправление прав на базу данных
    if [ -f "backend/dev.sqlite3" ]; then
        log "Исправление прав на базу данных..."
        sudo chown $USER:$USER backend/dev.sqlite3
        chmod 664 backend/dev.sqlite3
    fi

    if [ -d "data" ]; then
        log "Исправление прав на директорию data..."
        sudo chown -R $USER:$USER data/
    fi

    # Переустановка зависимостей frontend
    if [ -d "frontend" ]; then
        log "Переустановка зависимостей frontend..."
        cd frontend
        npm install
        cd ..
    fi

    # Переустановка зависимостей backend
    if [ -d "backend" ]; then
        log "Переустановка зависимостей backend..."
        cd backend
        npm install
        cd ..
    fi

    log "✅ Права доступа исправлены!"
}

# Обработка прерывания
trap 'error "Процесс прерван пользователем"' INT

# Запуск
fix_permissions
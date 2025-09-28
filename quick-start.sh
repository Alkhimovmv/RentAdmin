#!/bin/bash

# ==========================================
# Быстрый запуск RentAdmin на cloud.ru
# Упрощенная версия для случаев с проблемами git
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

# Основная функция быстрого запуска
quick_start() {
    log "🚀 Быстрый запуск RentAdmin..."

    # Проверка текущей директории
    if [ ! -f "docker-compose.yml" ]; then
        error "Скрипт должен запускаться из директории проекта RentAdmin"
    fi

    # Создание директории на сервере (если еще не создана)
    PROJECT_DIR="/opt/rentadmin"
    if [ ! -d "$PROJECT_DIR" ]; then
        log "Создание директории проекта..."
        sudo mkdir -p $PROJECT_DIR
        sudo chown -R $USER:$USER $PROJECT_DIR
    fi

    # Копирование файлов проекта
    log "Копирование файлов проекта..."
    sudo cp -r . $PROJECT_DIR/
    sudo chown -R $USER:$USER $PROJECT_DIR

    # Переход в директорию проекта
    cd $PROJECT_DIR

    # Удаление .git директории для избежания проблем с владением
    if [ -d ".git" ]; then
        warn "Удаление .git директории для избежания проблем с владением..."
        sudo rm -rf .git
    fi

    # Установка Docker если необходимо
    if ! command -v docker &> /dev/null; then
        log "Установка Docker..."
        sudo apt update
        sudo apt install -y docker.io docker-compose
        sudo systemctl enable docker
        sudo systemctl start docker
        sudo usermod -aG docker $USER
    fi

    # Установка Node.js если необходимо
    if ! command -v node &> /dev/null; then
        log "Установка Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    # Сборка frontend
    log "Сборка frontend..."
    cd frontend

    # Проверка наличия правильного package.json
    if ! grep -q '"build"' package.json 2>/dev/null; then
        error "В package.json отсутствует скрипт build. Проверьте правильность копирования файлов."
    fi

    # Очистка и исправление прав для node_modules
    if [ -d "node_modules" ]; then
        log "Очистка существующих node_modules..."
        sudo rm -rf node_modules
        sudo rm -f package-lock.json
    fi

    # Исправление прав доступа
    sudo chown -R $USER:$USER .

    # Отображение доступных скриптов для отладки
    log "Доступные npm скрипты:"
    npm run

    # Установка зависимостей
    npm install

    # Сборка для production
    VITE_API_URL=/api npm run build
    cd ..

    # Подготовка базы данных
    log "Подготовка базы данных..."
    mkdir -p data
    if [ -f "backend/dev.sqlite3" ]; then
        cp backend/dev.sqlite3 data/production.sqlite3
    else
        touch data/production.sqlite3
    fi
    chmod 664 data/production.sqlite3

    # Настройка файрвола
    log "Настройка файрвола..."
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw allow 3001

    # Запуск приложения
    log "Запуск приложения..."
    docker-compose down 2>/dev/null || true
    docker system prune -f
    docker-compose up --build -d

    # Проверка работоспособности
    log "Проверка работоспособности..."
    sleep 15

    # Проверка статуса контейнеров
    docker-compose ps

    # Проверка доступности
    for i in {1..10}; do
        if curl -f http://localhost/health &>/dev/null; then
            log "✅ Приложение успешно запущено!"
            break
        fi
        if [ $i -eq 10 ]; then
            warn "Приложение может быть еще не готово. Проверьте логи: docker-compose logs -f"
        fi
        echo -n "."
        sleep 3
    done

    # Информация о развертывании
    log "=== РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО ==="
    echo ""
    log "🌐 Приложение: http://87.242.103.146"
    log "🔧 API: http://87.242.103.146/api"
    log "🏥 Health: http://87.242.103.146/health"
    log "🔐 PIN-код: 20031997"
    echo ""
    log "📊 Управление:"
    log "   Статус:     docker-compose ps"
    log "   Логи:       docker-compose logs -f"
    log "   Перезапуск: docker-compose restart"
    log "   Остановка:  docker-compose down"
    echo ""
    warn "🔒 Не забудьте изменить JWT_SECRET и PIN_CODE в docker-compose.yml!"
}

# Обработка прерывания
trap 'error "Процесс прерван пользователем"' INT

# Запуск
quick_start
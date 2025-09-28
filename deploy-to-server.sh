#!/bin/bash

# ==========================================
# RentAdmin Production Deployment Script
# Для развертывания на cloud.ru VM (87.242.103.146)
# ==========================================

set -e  # Выйти при любой ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Логирование
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

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Проверка прав суперпользователя для установки пакетов
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        warn "Некоторые операции требуют прав sudo. Введите пароль при необходимости."
    fi
}

# Установка Docker и Docker Compose
install_docker() {
    log "Установка Docker и Docker Compose..."

    # Обновление системы
    sudo apt update && sudo apt upgrade -y

    # Установка зависимостей
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release git

    # Проверка, установлен ли уже Docker
    if command -v docker &> /dev/null; then
        info "Docker уже установлен: $(docker --version)"
    else
        # Добавление официального GPG ключа Docker
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

        # Добавление репозитория Docker
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Установка Docker
        sudo apt update
        sudo apt install -y docker-ce docker-ce-cli containerd.io

        # Добавление пользователя в группу docker
        sudo usermod -aG docker $USER

        log "Docker успешно установлен!"
    fi

    # Проверка Docker Compose
    if command -v docker-compose &> /dev/null; then
        info "Docker Compose уже установлен: $(docker-compose --version)"
    else
        # Установка Docker Compose
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose

        log "Docker Compose успешно установлен!"
    fi

    # Запуск Docker сервиса
    sudo systemctl enable docker
    sudo systemctl start docker
}

# Настройка файрвола
configure_firewall() {
    log "Настройка файрвола..."

    # Включение UFW
    sudo ufw --force enable

    # Разрешение SSH
    sudo ufw allow ssh
    sudo ufw allow 22

    # Разрешение HTTP и HTTPS
    sudo ufw allow 80
    sudo ufw allow 443

    # Разрешение backend порта (только для отладки)
    sudo ufw allow 3001

    # Применение правил
    sudo ufw reload

    info "Файрвол настроен. Открыты порты: 22, 80, 443, 3001"
}

# Клонирование или обновление репозитория
setup_project() {
    log "Настройка проекта..."

    PROJECT_DIR="/opt/rentadmin"

    if [ -d "$PROJECT_DIR" ]; then
        warn "Директория $PROJECT_DIR уже существует. Обновление..."
        cd $PROJECT_DIR

        # Исправление проблемы с владением git репозитория
        if [ -d ".git" ]; then
            log "Настройка git конфигурации..."
            sudo git config --global --add safe.directory $PROJECT_DIR
            sudo chown -R $USER:$USER .git

            # Попытка обновления репозитория
            if git pull origin main 2>/dev/null; then
                log "Репозиторий успешно обновлен"
            else
                warn "Не удалось обновить через git pull. Используются локальные файлы."
            fi
        else
            log "Git репозиторий не найден, используются локальные файлы"
        fi
    else
        log "Создание директории проекта..."
        sudo mkdir -p $PROJECT_DIR
        sudo chown -R $USER:$USER $PROJECT_DIR

        info "Для клонирования репозитория выполните:"
        info "cd $PROJECT_DIR"
        info "git clone <your-repo-url> ."
        info "Затем запустите этот скрипт снова."

        # Копирование файлов из текущей директории, если они есть
        if [ -f "docker-compose.yml" ]; then
            log "Копирование файлов проекта..."
            sudo cp -r . $PROJECT_DIR/
            sudo chown -R $USER:$USER $PROJECT_DIR
        fi
    fi

    cd $PROJECT_DIR
}

# Сборка frontend
build_frontend() {
    log "Сборка frontend..."

    if [ ! -d "frontend" ]; then
        error "Директория frontend не найдена!"
    fi

    cd frontend

    # Проверка наличия правильного package.json
    if ! grep -q '"build"' package.json 2>/dev/null; then
        error "В package.json отсутствует скрипт build. Запустите ./fix-project-files.sh для исправления."
    fi

    # Проверка наличия TypeScript конфигурационных файлов
    if [ ! -f "tsconfig.app.json" ] || [ ! -f "tsconfig.node.json" ]; then
        warn "Отсутствуют TypeScript конфигурационные файлы. Запустите ./fix-project-files.sh для исправления."
        error "Невозможно продолжить без tsconfig.app.json и tsconfig.node.json"
    fi

    # Установка Node.js если не установлен
    if ! command -v node &> /dev/null; then
        log "Установка Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
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
    log "Frontend собран успешно!"
}

# Подготовка базы данных
prepare_database() {
    log "Подготовка базы данных..."

    # Создание директории для данных
    mkdir -p data

    # Копирование существующей БД или создание новой
    if [ -f "backend/dev.sqlite3" ]; then
        cp backend/dev.sqlite3 data/production.sqlite3
        info "Скопирована существующая база данных"
    else
        touch data/production.sqlite3
        info "Создана новая база данных"
    fi

    # Установка прав
    chmod 664 data/production.sqlite3
}

# Запуск приложения
start_application() {
    log "Запуск приложения..."

    # Остановка существующих контейнеров
    docker-compose down 2>/dev/null || true

    # Удаление старых образов
    docker system prune -f

    # Сборка и запуск
    docker-compose up --build -d

    log "Проверка статуса контейнеров..."
    sleep 10
    docker-compose ps

    # Проверка здоровья приложения
    log "Проверка работоспособности..."

    # Ожидание запуска
    for i in {1..30}; do
        if curl -f http://localhost/health &>/dev/null; then
            log "✅ Приложение успешно запущено и доступно!"
            break
        fi
        if [ $i -eq 30 ]; then
            error "❌ Приложение не отвечает после 30 попыток"
        fi
        echo -n "."
        sleep 2
    done
}

# Отображение информации о развертывании
show_deployment_info() {
    log "=== ИНФОРМАЦИЯ О РАЗВЕРТЫВАНИИ ==="
    echo ""
    info "🌐 Приложение доступно по адресу: http://87.242.103.146"
    info "🔧 API доступно по адресу: http://87.242.103.146/api"
    info "🏥 Health check: http://87.242.103.146/health"
    echo ""
    info "📊 Управление контейнерами:"
    info "   Статус:     docker-compose ps"
    info "   Логи:       docker-compose logs -f"
    info "   Остановка:  docker-compose down"
    info "   Перезапуск: docker-compose restart"
    echo ""
    info "🔐 Данные для входа:"
    info "   PIN-код: 20031997"
    echo ""
    warn "🔒 Не забудьте изменить JWT_SECRET и PIN_CODE в production!"
}

# Основная функция
main() {
    log "🚀 Начало развертывания RentAdmin на cloud.ru"
    echo ""

    check_sudo
    install_docker
    configure_firewall
    setup_project
    build_frontend
    prepare_database
    start_application
    show_deployment_info

    log "🎉 Развертывание завершено успешно!"
}

# Обработка прерывания
trap 'error "Развертывание прервано пользователем"' INT

# Запуск основной функции
main
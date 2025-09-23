#!/bin/bash

# ===========================================
# Скрипт развертывания RentAdmin на Cloud.ru
# ===========================================

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
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

# Проверка, что скрипт запущен из корня проекта
if [ ! -f "docker-compose.cloud.yml" ]; then
    error "Файл docker-compose.cloud.yml не найден. Запустите скрипт из корня проекта."
    exit 1
fi

log "🚀 Начинаем развертывание RentAdmin на Cloud.ru"

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

# Проверка наличия docker-compose
if ! command -v docker-compose &> /dev/null; then
    error "docker-compose не установлен. Установите docker-compose и попробуйте снова."
    exit 1
fi

# Проверка .env файла
if [ ! -f ".env" ]; then
    warning ".env файл не найден."

    if [ -f ".env.cloud" ]; then
        info "Найден .env.cloud файл. Копируем его в .env"
        cp .env.cloud .env
    else
        error "Создайте .env файл на основе .env.cloud и заполните переменные окружения."
        exit 1
    fi
fi

# Проверка SSL сертификатов
if [ ! -d "nginx/ssl" ]; then
    warning "Папка nginx/ssl не найдена."

    read -p "Хотите создать самоподписанные сертификаты для тестирования? (y/n): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Создаем самоподписанные SSL сертификаты..."
        mkdir -p nginx/ssl

        # Создание самоподписанного сертификата
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=RU/ST=Moscow/L=Moscow/O=RentAdmin/CN=localhost"

        log "✅ Самоподписанные сертификаты созданы"
    else
        error "Поместите ваши SSL сертификаты в папку nginx/ssl/ (cert.pem и key.pem)"
        exit 1
    fi
fi

# Создание необходимых директорий
log "📁 Создаем необходимые директории..."
mkdir -p logs/nginx

# Остановка существующих контейнеров
log "🛑 Остановка существующих контейнеров..."
docker-compose -f docker-compose.cloud.yml down || true

# Удаление старых образов (опционально)
read -p "Хотите пересобрать образы заново? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "🔄 Пересборка образов..."
    docker-compose -f docker-compose.cloud.yml build --no-cache
else
    log "🔄 Сборка образов..."
    docker-compose -f docker-compose.cloud.yml build
fi

# Запуск базы данных
log "🗄️ Запуск базы данных..."
docker-compose -f docker-compose.cloud.yml up -d database

# Ожидание готовности базы данных
log "⏳ Ожидание готовности базы данных..."
sleep 30

# Проверка состояния базы данных
if ! docker-compose -f docker-compose.cloud.yml exec -T database pg_isready -U postgres; then
    error "База данных не готова. Проверьте логи: docker-compose -f docker-compose.cloud.yml logs database"
    exit 1
fi

log "✅ База данных готова"

# Запуск backend
log "🔧 Запуск backend..."
docker-compose -f docker-compose.cloud.yml up -d backend

# Ожидание готовности backend
log "⏳ Ожидание готовности backend..."
sleep 60

# Проверка health check backend
if ! docker-compose -f docker-compose.cloud.yml exec -T backend curl -f http://localhost:3001/api/health &> /dev/null; then
    warning "Backend health check не прошел. Проверьте логи: docker-compose -f docker-compose.cloud.yml logs backend"
fi

# Запуск nginx
log "🌐 Запуск nginx..."
docker-compose -f docker-compose.cloud.yml up -d nginx

# Проверка статуса всех сервисов
log "📊 Проверка статуса сервисов..."
docker-compose -f docker-compose.cloud.yml ps

# Финальная проверка
log "🔍 Финальная проверка системы..."

# Проверка API через nginx
if curl -k -f https://localhost/api/health &> /dev/null; then
    log "✅ API доступен через nginx"
else
    warning "❌ API недоступен через nginx. Проверьте конфигурацию nginx."
fi

# Проверка портов
log "📡 Открытые порты:"
docker-compose -f docker-compose.cloud.yml ps | grep -E "(80|443|3001|5432)"

# Вывод полезной информации
echo
log "🎉 Развертывание завершено!"
echo
info "📋 Полезная информация:"
echo "  • API доступен по адресу: https://your-server-ip/api"
echo "  • Health check: https://your-server-ip/health"
echo "  • Backend логи: docker-compose -f docker-compose.cloud.yml logs backend"
echo "  • Nginx логи: docker-compose -f docker-compose.cloud.yml logs nginx"
echo "  • База данных логи: docker-compose -f docker-compose.cloud.yml logs database"
echo
warning "📝 Не забудьте:"
echo "  1. Настроить DNS записи для вашего домена"
echo "  2. Заменить самоподписанные сертификаты на настоящие"
echo "  3. Обновить VITE_API_URL в фронтенде на Netlify"
echo "  4. Настроить CORS_ORIGIN в .env файле"
echo "  5. Настроить файерволл и безопасность сервера"
echo
log "✨ Ваш RentAdmin готов к работе!"
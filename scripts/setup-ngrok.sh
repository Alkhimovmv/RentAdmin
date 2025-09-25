#!/bin/bash

# Настройка ngrok для мгновенного получения HTTPS домена
# Идеально для разработки и тестирования

set -e

echo "🚀 Настройка ngrok для мгновенного HTTPS"
echo ""

# Установка ngrok
if ! command -v ngrok &> /dev/null; then
    echo "📦 Установка ngrok..."

    # Скачиваем ngrok
    curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update && sudo apt install ngrok
fi

echo "✅ ngrok установлен"
echo ""

echo "🔑 НАСТРОЙКА:"
echo "1. Зарегистрируйтесь на https://ngrok.com/"
echo "2. Получите authtoken из панели управления"
echo "3. Выполните: ngrok config add-authtoken ВАШ_ТОКЕН"
echo ""

echo "📋 Создание Docker Compose с ngrok:"

# Создаем docker-compose с ngrok
cat > docker-compose.ngrok.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL database
  database:
    image: postgres:15-alpine
    container_name: rent-admin-db
    environment:
      POSTGRES_DB: rent_admin
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - rent-admin-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: rent-admin-backend
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: database
      DB_PORT: 5432
      DB_NAME: rent_admin
      DB_USER: postgres
      DB_PASSWORD: password
      JWT_SECRET: super-secret-jwt-key-for-rent-admin-2024
      PIN_CODE: 20031997
      CORS_ORIGIN: "*"
    ports:
      - "3001:3001"
    depends_on:
      - database
    networks:
      - rent-admin-network
    volumes:
      - ./backend/src/migrations:/app/src/migrations
      - ./backend/src/seeds:/app/src/seeds
    command: sh -c "sleep 15 && npm run db:migrate && npm start"

  # ngrok tunnel
  ngrok:
    image: ngrok/ngrok:latest
    container_name: rent-admin-ngrok
    command: http backend:3001 --domain=your-static-domain.ngrok-free.app
    environment:
      NGROK_AUTHTOKEN: YOUR_NGROK_TOKEN_HERE
    ports:
      - "4040:4040"  # ngrok web interface
    networks:
      - rent-admin-network
    depends_on:
      - backend

volumes:
  postgres_data:

networks:
  rent-admin-network:
    driver: bridge
EOF

echo "✅ Создан docker-compose.ngrok.yml"
echo ""

# Создаем простой скрипт запуска
cat > run-with-ngrok.sh << 'EOF'
#!/bin/bash

echo "🚀 Запуск API с ngrok туннелем"

# Проверяем наличие токена
if ! ngrok config check > /dev/null 2>&1; then
    echo "❌ Необходимо настроить ngrok authtoken"
    echo "1. Зайдите на https://ngrok.com/"
    echo "2. Скопируйте ваш authtoken"
    echo "3. Выполните: ngrok config add-authtoken ВАШ_ТОКЕН"
    exit 1
fi

# Запускаем backend в фоне
echo "📦 Запуск backend..."
docker-compose up -d database backend

# Ждем запуска backend
echo "⏳ Ждем запуска backend..."
sleep 10

# Запускаем ngrok
echo "🌐 Запуск ngrok туннеля..."
ngrok http 3001 &

# Показываем информацию
sleep 3
echo ""
echo "✅ Сервисы запущены!"
echo ""
echo "📡 Backend: http://localhost:3001"
echo "🌐 ngrok панель: http://localhost:4040"
echo ""
echo "🔗 Ваш HTTPS URL будет показан в ngrok панели"
echo "   Откройте http://localhost:4040 чтобы увидеть публичный URL"
echo ""
echo "⏹️  Для остановки: Ctrl+C, затем 'docker-compose down'"
EOF

chmod +x run-with-ngrok.sh

echo "✅ Создан скрипт run-with-ngrok.sh"
echo ""

echo "📝 БЫСТРЫЙ СТАРТ:"
echo ""
echo "1. Настроить токен ngrok:"
echo "   - Зайти на https://ngrok.com/ и получить токен"
echo "   - ngrok config add-authtoken ВАШ_ТОКЕН"
echo ""
echo "2. Запустить с ngrok:"
echo "   ./run-with-ngrok.sh"
echo ""
echo "3. Открыть панель ngrok:"
echo "   http://localhost:4040"
echo ""
echo "4. Скопировать HTTPS URL и использовать для API"
echo ""

echo "🎉 Преимущества ngrok:"
echo "✅ Мгновенный валидный HTTPS сертификат"
echo "✅ Публичный доступ из любой точки мира"
echo "✅ Нет необходимости настраивать DNS"
echo "✅ Отлично для разработки и демо"
echo ""
echo "⚠️  Ограничения бесплатного плана:"
echo "- Случайный URL при каждом запуске"
echo "- Ограничение на количество подключений"
echo "- URL показывает предупреждение ngrok"
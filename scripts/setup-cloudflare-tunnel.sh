#!/bin/bash

# Настройка CloudFlare Tunnel для получения автоматического HTTPS
# Это полностью избавляет от проблем с SSL сертификатами

set -e

echo "☁️ Настройка CloudFlare Tunnel"
echo "Это даст вам бесплатный HTTPS домен без настройки SSL"
echo ""

# Установка cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Установка cloudflared..."

    # Для Ubuntu/Debian
    if command -v apt &> /dev/null; then
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
        sudo dpkg -i /tmp/cloudflared.deb
        rm /tmp/cloudflared.deb
    else
        # Для других систем
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
        sudo mv /tmp/cloudflared /usr/local/bin/
        sudo chmod +x /usr/local/bin/cloudflared
    fi
fi

echo "✅ cloudflared установлен"
echo ""

echo "🔑 НАСТРОЙКА:"
echo "1. Зайдите на https://dash.cloudflare.com/"
echo "2. Перейдите в 'Zero Trust' → 'Networks' → 'Tunnels'"
echo "3. Нажмите 'Create a tunnel'"
echo "4. Выберите 'Cloudflared'"
echo "5. Дайте имя туннелю (например: 'rentadmin')"
echo "6. Выберите среду 'Docker'"
echo "7. Скопируйте команду docker run"
echo ""

echo "📋 Создаем Docker Compose для CloudFlare Tunnel:"

# Создаем docker-compose для CloudFlare
cat > docker-compose.cloudflare.yml << 'EOF'
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
    ports:
      - "5432:5432"
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

  # CloudFlare Tunnel
  cloudflare-tunnel:
    image: cloudflare/cloudflared:latest
    container_name: rent-admin-tunnel
    command: tunnel --no-autoupdate run --token YOUR_TUNNEL_TOKEN_HERE
    networks:
      - rent-admin-network
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  rent-admin-network:
    driver: bridge
EOF

echo "✅ Создан docker-compose.cloudflare.yml"
echo ""

echo "📝 СЛЕДУЮЩИЕ ШАГИ:"
echo ""
echo "1. Получить токен туннеля:"
echo "   - Откройте https://dash.cloudflare.com/"
echo "   - Zero Trust → Networks → Tunnels → Create tunnel"
echo "   - Скопируйте токен из команды docker run"
echo ""
echo "2. Обновить токен в файле:"
echo "   sed -i 's/YOUR_TUNNEL_TOKEN_HERE/ваш-токен/' docker-compose.cloudflare.yml"
echo ""
echo "3. Запустить с CloudFlare:"
echo "   docker-compose -f docker-compose.cloudflare.yml up -d"
echo ""
echo "4. Настроить маршрутизацию в CloudFlare Dashboard:"
echo "   - Public Hostnames → Add a public hostname"
echo "   - Subdomain: rentadmin (или любой другой)"
echo "   - Domain: выберите ваш домен"
echo "   - Service: http://backend:3001"
echo ""

echo "🎉 Результат:"
echo "Вы получите домен вида: https://rentadmin.ваш-домен.com"
echo "С автоматическим валидным SSL сертификатом от CloudFlare!"
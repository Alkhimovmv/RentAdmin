#!/bin/bash

# Быстрое развертывание RentAdmin на cloud.ru (минимальная версия)
echo "⚡ Быстрое развертывание RentAdmin на cloud.ru"
echo "=============================================="
echo ""

# Проверяем права
if [[ $EUID -ne 0 ]]; then
    echo "❌ Запустите с sudo: sudo ./quick-deploy-cloud.sh"
    exit 1
fi

# Получаем IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "🌐 IP сервера: $SERVER_IP"

# Быстрая установка пакетов
echo "📦 Установка пакетов..."
apt update -qq
apt install -y nginx nodejs npm sqlite3 curl

# Остановка nginx
systemctl stop nginx

# Копируем nginx конфигурацию
cp nginx-cloud-http.conf /etc/nginx/nginx.conf

# Создаем директории
mkdir -p /var/www/html/rentadmin
mkdir -p /opt/rentadmin-app

# Собираем фронтенд
cd frontend
echo "VITE_API_URL=http://$SERVER_IP/api" > .env.production
npm install --silent
npm run build --silent
cp -r dist/* /var/www/html/rentadmin/

# Собираем бэкенд
cd ../backend
npm install --silent --production
npm run build --silent

# Настраиваем SQLite
cat > knexfile.production.js << 'EOF'
module.exports = {
    production: {
        client: 'sqlite3',
        connection: { filename: '/opt/rentadmin-app/production.sqlite3' },
        useNullAsDefault: true,
        migrations: { directory: './src/migrations' },
    }
};
EOF

# Копируем бэкенд
cp -r . /opt/rentadmin-app/backend/
NODE_ENV=production npm run db:migrate

# Создаем простой сервис
cat > /etc/systemd/system/rentadmin.service << 'EOF'
[Unit]
Description=RentAdmin
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/rentadmin-app/backend
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=JWT_SECRET=production-secret-key
Environment=PIN_CODE=20031997
Environment=CORS_ORIGIN=*
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Запускаем все
systemctl daemon-reload
systemctl enable rentadmin nginx
systemctl start rentadmin nginx

echo ""
echo "⏳ Ждем запуска..."
sleep 5

# Проверяем
if curl -s http://localhost/health > /dev/null; then
    echo ""
    echo "🎉 УСПЕШНО РАЗВЕРНУТО!"
    echo ""
    echo "🌍 Откройте: http://$SERVER_IP/"
    echo "🎯 API: http://$SERVER_IP/api"
    echo ""
    echo "🔧 Управление:"
    echo "systemctl restart rentadmin nginx"
    echo "systemctl status rentadmin"
else
    echo ""
    echo "❌ Что-то пошло не так. Проверьте:"
    echo "systemctl status rentadmin nginx"
    echo "journalctl -u rentadmin -n 20"
fi
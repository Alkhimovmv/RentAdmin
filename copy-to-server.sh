#!/bin/bash

echo "📋 Копирование RentAdmin фронтенда на сервер"
echo "============================================"

SERVER_IP="87.242.103.146"
LOCAL_DIST="/home/maxim/RentAdmin/frontend/dist"
WEB_DIR="/var/www/html/rentadmin"

# Проверяем сборку
if [ ! -d "$LOCAL_DIST" ]; then
    echo "❌ Сборка не найдена в $LOCAL_DIST"
    exit 1
fi

echo "✅ Найдена сборка фронтенда"

# Копирование с использованием команд, которые не требуют пароль
echo "🧹 Очистка старых файлов..."
rm -rf /tmp/rentadmin_deploy
mkdir -p /tmp/rentadmin_deploy

echo "📋 Подготовка файлов..."
cp -r "$LOCAL_DIST"/* /tmp/rentadmin_deploy/

echo "📋 Файлы подготовлены для развертывания:"
ls -la /tmp/rentadmin_deploy/

echo ""
echo "🚀 Теперь выполните эти команды для завершения развертывания:"
echo "sudo systemctl stop nginx"
echo "sudo rm -rf $WEB_DIR/*"
echo "sudo cp -r /tmp/rentadmin_deploy/* $WEB_DIR/"
echo "sudo chown -R www-data:www-data $WEB_DIR"
echo "sudo chmod -R 755 $WEB_DIR"
echo "sudo find $WEB_DIR -type f -exec chmod 644 {} \\;"
echo "sudo systemctl start nginx"
echo ""
echo "После этого ваш проект будет доступен: http://$SERVER_IP/"
#!/bin/bash

echo "📋 Копирование собранного фронтенда на сервер"
echo "=============================================="

# Проверяем что фронтенд уже собран локально
if [ ! -d "/home/user1/RentAdmin/frontend/dist" ]; then
    echo "❌ Сборка фронтенда не найдена в /home/user1/RentAdmin/frontend/dist"
    echo "Сначала соберите фронтенд локально:"
    echo "cd /home/user1/RentAdmin/frontend"
    echo "npm run build"
    exit 1
fi

echo "✅ Найдена сборка фронтенда"

# Остановка nginx
echo "⏹️ Остановка nginx..."
sudo systemctl stop nginx

# Очистка и копирование
echo "🧹 Очистка старых файлов..."
sudo rm -rf /var/www/html/rentadmin/*

echo "📋 Копирование нового фронтенда..."
sudo cp -r /home/user1/RentAdmin/frontend/dist/* /var/www/html/rentadmin/

# Права доступа
echo "🔧 Настройка прав доступа..."
sudo chown -R www-data:www-data /var/www/html/rentadmin
sudo chmod -R 755 /var/www/html/rentadmin
sudo find /var/www/html/rentadmin -type f -exec chmod 644 {} \;

# Запуск nginx
echo "🚀 Запуск nginx..."
sudo systemctl start nginx

sleep 2

# Проверка
if curl -s http://localhost/ | grep -q "html"; then
    echo "✅ Фронтенд развернут успешно!"
    echo "🌍 Откройте: http://87.242.103.146/"
else
    echo "❌ Проблема с развертыванием"
fi

echo ""
echo "📋 Файлы в веб-директории:"
sudo ls -la /var/www/html/rentadmin/ | head -5
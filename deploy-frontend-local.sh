#!/bin/bash

echo "🚀 Развертывание фронтенда локально на текущей машине"
echo "===================================================="

SERVER_IP="87.242.103.146"

# Переход в директорию фронтенда
echo "📁 Переход в директорию фронтенда..."
cd /home/maxim/RentAdmin/frontend

# Создание правильного .env.production для сервера
echo "🔧 Создание .env.production для сервера..."
tee .env.production > /dev/null << EOF
VITE_API_URL=http://$SERVER_IP/api
NODE_ENV=production
EOF

echo "✅ Создан .env.production:"
cat .env.production

# Сборка фронтенда
echo "🔨 Сборка фронтенда..."
npm run build

# Проверка сборки
if [ ! -d "dist" ]; then
    echo "❌ Сборка не создала директорию dist"
    exit 1
fi

echo "✅ Фронтенд собран успешно"

# Остановка nginx на сервере
echo "⏹️ Остановка nginx на сервере..."
sudo systemctl stop nginx

# Очистка и копирование
echo "🧹 Очистка старых файлов на сервере..."
sudo rm -rf /var/www/html/rentadmin/*

echo "📋 Копирование нового фронтенда на сервер..."
sudo cp -r dist/* /var/www/html/rentadmin/

# Права доступа
echo "🔧 Настройка прав доступа..."
sudo chown -R www-data:www-data /var/www/html/rentadmin
sudo chmod -R 755 /var/www/html/rentadmin
sudo find /var/www/html/rentadmin -type f -exec chmod 644 {} \;

# Проверка файлов
echo "📋 Проверка скопированных файлов..."
sudo ls -la /var/www/html/rentadmin/

# Запуск nginx
echo "🚀 Запуск nginx..."
sudo systemctl start nginx

# Ожидание и проверка
sleep 3

echo ""
echo "🧪 ПРОВЕРКА РЕЗУЛЬТАТА:"
echo "======================"

if curl -s http://localhost/ | grep -q "html"; then
    echo "✅ Фронтенд загружается"

    # Проверяем что это наш проект
    if curl -s http://localhost/ | grep -q -E "(RentAdmin|Возьми меня|Аренда)"; then
        echo "✅ Это ваш React проект RentAdmin!"
    else
        echo "⚠️ Загружается HTML, проверьте содержимое"
    fi

    echo ""
    echo "🎉 ГОТОВО!"
    echo "=========="
    echo "🌍 Ваш проект доступен: http://$SERVER_IP/"
    echo "🎯 API работает: http://$SERVER_IP/api"
    echo "🏥 Health check: http://$SERVER_IP/health"

else
    echo "❌ Проблема с загрузкой фронтенда"
    echo ""
    echo "🔍 ДИАГНОСТИКА:"
    echo "sudo systemctl status nginx"
    echo "curl -I http://localhost/"
fi

echo ""
echo "📋 Содержимое index.html:"
sudo head -10 /var/www/html/rentadmin/index.html
#!/bin/bash

echo "🚀 Развертывание настоящего фронтенда RentAdmin"
echo "==============================================="

SERVER_IP="87.242.103.146"

# Переходим в директорию фронтенда на локальной машине
echo "📁 Переход в директорию фронтенда..."
cd /home/maxim/RentAdmin/frontend

# Проверяем что мы в правильной директории
if [ ! -f "package.json" ]; then
    echo "❌ package.json не найден. Проверьте путь к фронтенду."
    exit 1
fi

echo "✅ Найден фронтенд проект"

# Создаем правильный .env.production
echo "🔧 Настройка окружения для production..."
tee .env.production > /dev/null << EOF
VITE_API_URL=http://$SERVER_IP/api
NODE_ENV=production
EOF

echo "✅ Создан .env.production:"
cat .env.production

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей фронтенда..."
    npm install
fi

# Собираем фронтенд
echo "🔨 Сборка фронтенда для production..."
npm run build

# Проверяем что сборка прошла успешно
if [ ! -d "dist" ]; then
    echo "❌ Сборка не создала директорию dist"
    echo "Доступные скрипты:"
    npm run
    exit 1
fi

echo "✅ Фронтенд собран успешно"

# Остановка nginx
echo "⏹️ Остановка nginx..."
sudo systemctl stop nginx

# Очистка старых файлов
echo "🧹 Очистка старых файлов..."
sudo rm -rf /var/www/html/rentadmin/*

# Копирование нового фронтенда
echo "📋 Копирование нового фронтенда..."
sudo cp -r dist/* /var/www/html/rentadmin/

# Исправление прав доступа
echo "🔧 Настройка прав доступа..."
sudo chown -R www-data:www-data /var/www/html/rentadmin
sudo chmod -R 755 /var/www/html/rentadmin
sudo find /var/www/html/rentadmin -type f -exec chmod 644 {} \;

# Проверяем что index.html существует
if [ ! -f "/var/www/html/rentadmin/index.html" ]; then
    echo "❌ index.html не найден после сборки!"
    echo "Содержимое dist:"
    ls -la dist/
    exit 1
fi

echo "✅ index.html найден"

# Запуск nginx
echo "🚀 Запуск nginx..."
sudo systemctl start nginx

# Ожидание
sleep 3

# Проверка результата
echo ""
echo "🧪 ПРОВЕРКА РЕЗУЛЬТАТА:"
echo "======================"

if curl -s http://localhost/ | grep -q "html"; then
    echo "✅ Фронтенд загружается"

    # Проверяем что это наш проект (ищем характерные элементы)
    if curl -s http://localhost/ | grep -q -E "(Возьми меня|RentAdmin|id=\"root\")"; then
        echo "✅ Это ваш React проект!"
    else
        echo "⚠️ Загружается HTML, но может быть не ваш проект"
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
    echo "sudo ls -la /var/www/html/rentadmin/"
    echo "sudo systemctl status nginx"
    echo "curl -I http://localhost/"
fi

echo ""
echo "📋 Файлы в /var/www/html/rentadmin/:"
sudo ls -la /var/www/html/rentadmin/ | head -10
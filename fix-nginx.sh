#!/bin/bash

echo "🔧 Быстрое исправление nginx конфигурации"
echo "========================================"

# Остановка nginx
echo "⏹️ Остановка nginx..."
sudo systemctl stop nginx

# Резервная копия
echo "💾 Создание резервной копии..."
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)

# Применение простой конфигурации
echo "📋 Применение исправленной конфигурации..."
sudo cp nginx-simple.conf /etc/nginx/nginx.conf

# Проверка конфигурации
echo "🔍 Проверка конфигурации..."
if sudo nginx -t; then
    echo "✅ Конфигурация nginx корректна"

    # Запуск nginx
    echo "🚀 Запуск nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx

    # Проверка статуса
    if sudo systemctl is-active --quiet nginx; then
        echo "✅ nginx запущен успешно"

        # Тест фронтенда
        sleep 2
        if curl -s http://localhost/ > /dev/null; then
            echo "✅ Фронтенд доступен"
        else
            echo "⚠️ Фронтенд не отвечает (возможно нет файлов)"
        fi

        # Тест API прокси
        if curl -s http://localhost/api/health > /dev/null; then
            echo "✅ API прокси работает"
            curl -s http://localhost/api/health
        else
            echo "⚠️ API прокси не работает (возможно бэкенд не запущен)"
        fi

    else
        echo "❌ nginx не запустился"
        sudo journalctl -u nginx -n 10
    fi
else
    echo "❌ Ошибка в конфигурации nginx"
    sudo nginx -t

    # Восстановление из резервной копии
    echo "🔄 Восстановление оригинальной конфигурации..."
    sudo cp /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S) /etc/nginx/nginx.conf
fi

echo ""
echo "🎯 Готово! Проверьте:"
echo "sudo systemctl status nginx"
echo "curl http://87.242.103.146/"
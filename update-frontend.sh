#!/bin/bash

# Скрипт для обновления фронтенда RentAdmin
# Автоматически собирает и обновляет фронтенд приложения

echo "🚀 Обновление фронтенда RentAdmin..."
echo "================================="

# Информация о системе
echo "📍 Текущая директория: $(pwd)"
echo "👤 Пользователь: $(whoami)"
echo "🕒 Время: $(date)"

echo ""

# Переход в директорию frontend
echo "📂 Переход в директорию frontend..."
cd frontend

# Проверка наличия package.json
if [ ! -f "package.json" ]; then
    echo "❌ Файл package.json не найден в директории frontend!"
    exit 1
fi

# Установка зависимостей (если нужно)
echo "📦 Проверка и установка зависимостей..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "🔄 Установка зависимостей..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка установки зависимостей"
        exit 1
    fi
else
    echo "✅ Зависимости актуальны"
fi

# Очистка старой сборки
echo "🗑️  Очистка старой сборки..."
rm -rf dist/

# Сборка фронтенда
echo "🔧 Сборка фронтенда..."
if npm run build; then
    if [ -f "dist/index.html" ]; then
        echo "✅ Фронтенд собран успешно"
        echo "📊 Размер dist/index.html: $(stat -c%s dist/index.html) байт"
        echo "📅 Дата сборки: $(date)"

        # Показать размеры основных файлов
        echo ""
        echo "📋 Размеры файлов сборки:"
        ls -lh dist/assets/ | head -10

        # Подсчет общего размера
        TOTAL_SIZE=$(du -sh dist/ | cut -f1)
        echo "📦 Общий размер сборки: $TOTAL_SIZE"

    else
        echo "❌ Сборка завершилась, но файл dist/index.html не создан"
        exit 1
    fi
else
    echo "❌ Ошибка сборки фронтенда"
    exit 1
fi

# Возврат в корневую директорию
cd ..

# Перезапуск nginx
echo ""
echo "🔄 Попытка перезапуска nginx..."

# Проверяем, установлен ли nginx
if ! command -v nginx > /dev/null 2>&1; then
    echo "ℹ️  Nginx не найден в системе"
    echo "💡 Если nginx не используется, фронтенд все равно обновлен успешно"
    echo ""
else
    echo "🔍 Nginx найден, попытка перезапуска..."

    # Пробуем перезапустить nginx без sudo (если права настроены)
    if systemctl --user restart nginx 2>/dev/null; then
        echo "✅ Nginx перезапущен через user systemctl"
    elif nginx -s reload 2>/dev/null; then
        echo "✅ Nginx перезагружен без sudo"
    else
        # Если нужны sudo права, предупреждаем пользователя
        echo "⚠️  Для перезапуска nginx требуются права администратора"
        echo ""
        echo "📋 Выполните одну из команд для применения изменений:"
        echo "   sudo systemctl restart nginx"
        echo "   или"
        echo "   sudo nginx -s reload"
        echo ""
        echo "💡 Альтернативно, обновите страницу принудительно (Ctrl+F5)"

        # Предлагаем пользователю ввести пароль, если он хочет
        echo ""
        read -p "🔑 Попробовать перезапустить nginx с sudo? (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 Попытка перезапуска с sudo..."
            if sudo systemctl restart nginx 2>/dev/null; then
                echo "✅ Nginx успешно перезапущен"
            elif sudo nginx -s reload 2>/dev/null; then
                echo "✅ Nginx перезагружен"
            else
                echo "❌ Не удалось перезапустить nginx"
                echo "🛠️  Проверьте: sudo systemctl status nginx"
            fi
        fi
    fi
fi

echo ""
echo "🎉 Обновление фронтенда завершено успешно!"
echo "📝 Новая версия готова к использованию"
echo ""
echo "💡 Для применения изменений:"
echo "   - Nginx был автоматически перезапущен"
echo "   - Обновите страницу в браузере (Ctrl+F5 для принудительного обновления)"
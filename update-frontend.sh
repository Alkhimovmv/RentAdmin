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

echo ""
echo "🎉 Обновление фронтенда завершено успешно!"
echo "📝 Новая версия готова к использованию"
echo ""
echo "💡 Для применения изменений:"
echo "   - Обновите страницу в браузере (Ctrl+F5 для принудительного обновления)"
echo "   - Или перезапустите nginx если используется кеширование"
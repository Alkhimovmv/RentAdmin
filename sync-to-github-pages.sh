#!/bin/bash

echo "🔄 Синхронизация frontend с GitHub Pages репозиторием"
echo "===================================================="

FRONTEND_REPO_PATH="/tmp/RentAdminFrontend"
GITHUB_REPO="https://github.com/Alkhimovmv/RentAdminFrontend.git"

# Удаляем старую временную папку
rm -rf "$FRONTEND_REPO_PATH"

# Клонируем репозиторий GitHub Pages
echo "📥 Клонирование репозитория GitHub Pages..."
git clone "$GITHUB_REPO" "$FRONTEND_REPO_PATH"

if [ ! -d "$FRONTEND_REPO_PATH" ]; then
    echo "❌ Не удалось клонировать репозиторий"
    exit 1
fi

cd "$FRONTEND_REPO_PATH"

# Копируем все файлы frontend кроме node_modules и dist
echo "📋 Копирование файлов..."
rsync -av --exclude='node_modules/' --exclude='dist/' --exclude='.git/' /home/maxim/RentAdmin/frontend/ ./

# Добавляем изменения
git add .

# Проверяем есть ли изменения
if git diff --staged --quiet; then
    echo "✅ Нет изменений для синхронизации"
    exit 0
fi

# Коммитим
echo "💾 Создание коммита..."
git commit -m "🔧 Синхронизация из основного репозитория RentAdmin

- Исправлен API клиент для правильного использования HTTP
- Обновлены настройки для GitHub Pages
- Автоматическая синхронизация $(date)"

# Пушим
echo "📤 Отправка на GitHub..."
git push origin main

echo ""
echo "✅ Синхронизация завершена!"
echo "🌍 GitHub Pages обновится в течение нескольких минут"
echo "🔗 Проверьте: https://alkhimovmv.github.io/"

# Очистка
cd /home/maxim/RentAdmin
rm -rf "$FRONTEND_REPO_PATH"
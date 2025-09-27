#!/bin/bash

echo "📤 Загрузка скриптов на сервер cloud.ru"
echo "======================================="

SERVER_IP="87.242.103.146"
SERVER_USER="user1"

# Проверяем что у нас есть доступ к серверу
echo "🔗 Проверка подключения к серверу..."

# Список файлов для копирования
FILES_TO_COPY=(
    "deploy-real-frontend.sh"
    "copy-frontend-to-server.sh"
    "fix-403.sh"
    "nginx-simple.conf"
    "fix-all-issues.sh"
    "fix-backend-quick.sh"
)

echo "📋 Файлы для копирования:"
for file in "${FILES_TO_COPY[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (не найден)"
    fi
done

echo ""
echo "📤 Команды для копирования на сервер:"
echo "===================================="

for file in "${FILES_TO_COPY[@]}"; do
    if [ -f "$file" ]; then
        echo "scp $file $SERVER_USER@$SERVER_IP:/home/user1/RentAdmin/"
    fi
done

echo ""
echo "🔧 После копирования на сервере выполните:"
echo "=========================================="
echo "ssh $SERVER_USER@$SERVER_IP"
echo "cd /home/user1/RentAdmin"
echo "chmod +x *.sh"
echo "sudo ./deploy-real-frontend.sh"

echo ""
echo "💡 Альтернативно - выполните команды по одной:"
echo "=============================================="
echo "1. scp deploy-real-frontend.sh $SERVER_USER@$SERVER_IP:/home/user1/RentAdmin/"
echo "2. ssh $SERVER_USER@$SERVER_IP 'cd /home/user1/RentAdmin && chmod +x deploy-real-frontend.sh && sudo ./deploy-real-frontend.sh'"
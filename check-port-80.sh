#!/bin/bash

# Скрипт для диагностики порта 80

echo "🔍 Диагностика порта 80"
echo "======================"
echo ""

echo "1️⃣  Проверка что слушает порт 80:"
sudo lsof -i :80 2>/dev/null || echo "lsof требует sudo"
echo ""

echo "2️⃣  Альтернативная проверка (ss):"
sudo ss -tlnp | grep :80 2>/dev/null || ss -tln | grep :80
echo ""

echo "3️⃣  Проверка systemd служб nginx/apache:"
systemctl status nginx 2>/dev/null | head -5 || echo "Системный nginx не найден"
echo ""
systemctl status apache2 2>/dev/null | head -5 || echo "Системный apache не найден"
echo ""

echo "4️⃣  Docker контейнеры:"
docker ps -a --filter "name=rentadmin"
echo ""

echo "5️⃣  Все Docker контейнеры на порту 80:"
docker ps -a --filter "publish=80"
echo ""

echo "6️⃣  Проверка доступности через curl:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/ || echo "Не доступен"
echo ""

echo "📝 Рекомендации:"
echo ""
echo "Если порт 80 занят системным nginx:"
echo "  sudo systemctl stop nginx"
echo "  sudo systemctl disable nginx"
echo ""
echo "Если порт 80 занят Apache:"
echo "  sudo systemctl stop apache2"
echo "  sudo systemctl disable apache2"
echo ""
echo "Затем повторите:"
echo "  ./force-frontend-update.sh"
echo ""

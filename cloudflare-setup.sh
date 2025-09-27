#!/bin/bash

# Быстрая настройка Cloudflare Tunnel для постоянного доступа

echo "☁️ Настройка Cloudflare Tunnel"
echo "=============================="
echo ""

echo "🚀 Cloudflare Tunnel - лучшее решение для постоянного доступа!"
echo ""
echo "💡 ПРЕИМУЩЕСТВА:"
echo "✅ Постоянный домен (например: rentadmin.yourdomain.com)"
echo "✅ Автоматический HTTPS"
echo "✅ Нет необходимости в портах"
echo "✅ Работает за любым файрволом"
echo "✅ Бесплатно"
echo ""

echo "📋 ПОШАГОВАЯ НАСТРОЙКА:"
echo ""
echo "1️⃣ ПОДГОТОВКА:"
echo "   • Зайдите на https://dash.cloudflare.com/"
echo "   • Зарегистрируйтесь (бесплатно)"
echo ""

echo "2️⃣ СОЗДАНИЕ ТУННЕЛЯ:"
echo "   • Zero Trust → Networks → Tunnels"
echo "   • Create a tunnel"
echo "   • Имя туннеля: rentadmin"
echo "   • Выберите: Debian"
echo ""

echo "3️⃣ УСТАНОВКА:"
echo "   • Скопируйте команду установки из интерфейса"
echo "   • Запустите её в этом терминале"
echo "   • Пример команды:"
echo "     sudo cloudflared service install [ваш-токен]"
echo ""

echo "4️⃣ НАСТРОЙКА МАРШРУТА:"
echo "   • Public Hostnames → Add a public hostname"
echo "   • Subdomain: rentadmin (или любой)"
echo "   • Domain: выберите ваш домен"
echo "   • Service Type: HTTP"
echo "   • URL: localhost:3000"
echo ""

echo "5️⃣ РЕЗУЛЬТАТ:"
echo "   • Ваш сайт будет доступен по:"
echo "     https://rentadmin.yourdomain.com"
echo ""

read -p "Хотите продолжить настройку Cloudflare? (y/n): " continue_setup

if [[ $continue_setup == "y" || $continue_setup == "Y" ]]; then
    echo ""
    echo "🌐 Открываю Cloudflare Dashboard..."

    # Пытаемся открыть браузер
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://dash.cloudflare.com/"
    elif command -v open &> /dev/null; then
        open "https://dash.cloudflare.com/"
    else
        echo "Откройте в браузере: https://dash.cloudflare.com/"
    fi

    echo ""
    echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
    echo "1. Завершите настройку в браузере"
    echo "2. Вернитесь сюда и запустите полученную команду"
    echo "3. После установки проверьте доступность"
    echo ""
    echo "💡 ВАЖНО:"
    echo "• Убедитесь что локальный сервер запущен (./local-start.sh)"
    echo "• В настройках туннеля укажите: localhost:3000"
    echo ""
else
    echo ""
    echo "ℹ️ Настройку можно выполнить позже"
    echo "Запустите: ./cloudflare-setup.sh"
fi

echo ""
echo "🔧 АЛЬТЕРНАТИВНЫЕ РЕШЕНИЯ:"
echo ""
echo "🚀 Для быстрого тестирования:"
echo "   ./start-remote.sh (ngrok)"
echo ""
echo "📱 Для мобильного тестирования:"
echo "   ./local-start.sh (локальная сеть)"
echo ""
echo "🌍 Для глобального доступа:"
echo "   ./cloudflare-setup.sh (этот скрипт)"
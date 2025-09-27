#!/bin/bash

# Настройка удаленного доступа к RentAdmin

echo "🌍 Настройка удаленного доступа к RentAdmin"
echo "=========================================="
echo ""

LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "📋 ДОСТУПНЫЕ ВАРИАНТЫ:"
echo ""
echo "1. 🚀 localtunnel - мгновенный публичный URL (БЕЗ РЕГИСТРАЦИИ)"
echo "2. 🔑 ngrok - публичный URL (требует регистрацию)"
echo "3. ☁️ Cloudflare Tunnel - постоянный домен"
echo "4. 🔧 Port Forwarding - через роутер"
echo "5. 📱 VPN - через личную сеть"
echo ""

read -p "Выберите вариант (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Настройка localtunnel (БЕЗ РЕГИСТРАЦИИ)..."
        echo ""
        echo "✅ Готово! Запускаю туннель..."
        exec ./start-tunnel.sh
        ;;

    2)
        echo ""
        echo "🔑 Настройка ngrok..."
        echo ""

        # Проверяем установлен ли ngrok
        if ! command -v ngrok &> /dev/null; then
            echo "📦 Установка ngrok..."

            # Скачиваем и устанавливаем ngrok
            wget -O /tmp/ngrok.tgz https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
            sudo tar xvf /tmp/ngrok.tgz -C /usr/local/bin
            rm /tmp/ngrok.tgz

            echo "✅ ngrok установлен"
        fi

        echo ""
        echo "🔑 НАСТРОЙКА NGROK:"
        echo "1. Зайдите на https://ngrok.com/"
        echo "2. Зарегистрируйтесь (бесплатно)"
        echo "3. Скопируйте ваш authtoken"
        echo "4. Выполните: ngrok config add-authtoken ВАШ_ТОКЕН"
        echo ""
        echo "🚀 ЗАПУСК:"
        echo "После настройки токена запустите:"
        echo "./start-remote.sh"
        ;;

    3)
        echo ""
        echo "☁️ Cloudflare Tunnel..."
        echo ""
        echo "🔑 НАСТРОЙКА:"
        echo "1. Зайдите на https://dash.cloudflare.com/"
        echo "2. Zero Trust → Networks → Tunnels"
        echo "3. Create tunnel → дайте имя → Next"
        echo "4. Выберите Debian → скопируйте команду"
        echo "5. Запустите скопированную команду"
        echo ""
        echo "Затем настройте Public Hostname:"
        echo "- Service: http://localhost:3000"
        echo "- Subdomain: любой (например: rentadmin)"
        ;;

    4)
        echo ""
        echo "🔧 Port Forwarding через роутер..."
        echo ""
        echo "📋 ШАГИ:"
        echo "1. Откройте админку роутера (обычно 192.168.0.1 или 192.168.1.1)"
        echo "2. Найдите Port Forwarding / Virtual Servers"
        echo "3. Добавьте правило:"
        echo "   - External Port: 3000"
        echo "   - Internal IP: $LOCAL_IP"
        echo "   - Internal Port: 3000"
        echo "   - Protocol: TCP"
        echo ""
        echo "4. Узнайте ваш внешний IP:"
        curl -s ifconfig.me
        echo ""
        echo "5. Доступ будет по: http://ВАШ_ВНЕШНИЙ_IP:3000/"
        echo ""
        echo "⚠️ ВНИМАНИЕ: Требуется статический IP от провайдера"
        ;;

    5)
        echo ""
        echo "📱 VPN решения..."
        echo ""
        echo "🔧 ВАРИАНТЫ:"
        echo "1. Tailscale (рекомендуется):"
        echo "   - curl -fsSL https://tailscale.com/install.sh | sh"
        echo "   - sudo tailscale up"
        echo ""
        echo "2. WireGuard:"
        echo "   - Настройка сложнее, но более гибкая"
        echo ""
        echo "3. OpenVPN:"
        echo "   - Классическое решение"
        echo ""
        echo "После настройки VPN доступ будет по внутреннему IP"
        ;;

    *)
        echo "❌ Неверный выбор"
        exit 1
        ;;
esac

echo ""
echo "💡 РЕКОМЕНДАЦИИ:"
echo ""
echo "🥇 Для быстрого тестирования: ngrok"
echo "🥈 Для постоянного доступа: Cloudflare Tunnel"
echo "🥉 Для полного контроля: Port Forwarding + статический IP"
echo "🔒 Для безопасности: VPN (Tailscale)"
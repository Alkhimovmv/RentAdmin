#!/bin/bash

# Настройка бесплатного домена для получения валидного SSL сертификата
# Это избавит от необходимости добавления самоподписанного сертификата в ОС

echo "🌐 Настройка бесплатного домена для сервера"
echo "IP сервера: 87.242.103.146"
echo ""

echo "📋 ВАРИАНТЫ БЕСПЛАТНЫХ ДОМЕНОВ:"
echo ""
echo "1. 🆓 Freenom (freenom.com):"
echo "   - Домены: .tk, .ml, .ga, .cf"
echo "   - Бесплатно на 12 месяцев"
echo "   - Пример: rentadmin.tk"
echo ""
echo "2. 🔷 No-IP (noip.com):"
echo "   - Поддомены: yourname.hopto.org"
echo "   - Бесплатно с подтверждением каждые 30 дней"
echo "   - Пример: rentadmin.hopto.org"
echo ""
echo "3. 🌟 DuckDNS (duckdns.org):"
echo "   - Поддомены: yourname.duckdns.org"
echo "   - Полностью бесплатно"
echo "   - Пример: rentadmin.duckdns.org"
echo ""
echo "4. ☁️ CloudFlare Tunnel:"
echo "   - Автоматический HTTPS через CloudFlare"
echo "   - Бесплатный поддомен"
echo "   - Нет необходимости в портах 80/443"
echo ""

echo "⚡ БЫСТРАЯ НАСТРОЙКА - DuckDNS:"
echo "1. Зайти на https://www.duckdns.org"
echo "2. Войти через Google/GitHub"
echo "3. Создать поддомен (например: rentadmin)"
echo "4. Указать IP: 87.242.103.146"
echo "5. Скопировать токен"
echo ""

echo "📝 После получения домена запустить:"
echo "sudo certbot --nginx -d ваш-домен.duckdns.org"
echo ""

echo "🔄 Альтернативно - автоматическая настройка CloudFlare:"
echo "./scripts/setup-cloudflare-tunnel.sh"
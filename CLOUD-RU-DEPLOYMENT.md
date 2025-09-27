# ☁️ Развертывание RentAdmin на cloud.ru

Полная инструкция по развертыванию приложения RentAdmin на сервере cloud.ru с HTTP доступом по IP.

## 🎯 Результат развертывания

После выполнения всех шагов вы получите:
- **Веб-интерфейс**: `http://ВАШ_IP_СЕРВЕРА/`
- **API**: `http://ВАШ_IP_СЕРВЕРА/api`
- **Мониторинг**: `http://ВАШ_IP_СЕРВЕРА/health`

---

## 🚀 Быстрое развертывание (автоматическое)

### Шаг 1: Подготовка сервера
```bash
# На сервере cloud.ru выполните:
sudo apt update
sudo apt install -y git curl
```

### Шаг 2: Загрузка проекта
```bash
# Клонируйте репозиторий или загрузите файлы проекта
git clone <ваш-репозиторий> /opt/rentadmin
# ИЛИ скопируйте файлы любым удобным способом

cd /opt/rentadmin
```

### Шаг 3: Автоматическое развертывание
```bash
# Запустите скрипт автоматического развертывания
sudo ./deploy-cloud-http.sh
```

**Готово!** Скрипт автоматически:
- Установит все необходимые пакеты
- Настроит nginx
- Соберет и запустит приложение
- Настроит автозапуск

---

## 🔧 Ручное развертывание (пошаговое)

### 1️⃣ Установка системных пакетов

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y nginx nodejs npm sqlite3 curl git ufw

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs
```

### 2️⃣ Настройка файрвола

```bash
# Разрешаем необходимые порты
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw --force enable

# Проверяем статус
sudo ufw status
```

### 3️⃣ Создание пользователя

```bash
# Создаем пользователя для приложения
sudo useradd -m -s /bin/bash rentadmin
sudo usermod -aG sudo rentadmin

# Создаем директории
sudo mkdir -p /var/www/html/rentadmin
sudo mkdir -p /opt/rentadmin
sudo mkdir -p /var/log/rentadmin
```

### 4️⃣ Установка приложения

```bash
# Копируем файлы проекта
sudo cp -r . /opt/rentadmin/
sudo chown -R rentadmin:rentadmin /opt/rentadmin
sudo chown -R rentadmin:rentadmin /var/www/html/rentadmin
sudo chown -R rentadmin:rentadmin /var/log/rentadmin

cd /opt/rentadmin
```

### 5️⃣ Настройка бэкенда

```bash
cd /opt/rentadmin/backend

# Установка зависимостей
sudo -u rentadmin npm install --production

# Сборка TypeScript
sudo -u rentadmin npm run build

# Настройка базы данных
sudo -u rentadmin NODE_ENV=production npm run db:migrate
```

### 6️⃣ Настройка фронтенда

```bash
cd /opt/rentadmin/frontend

# Получаем IP сервера
SERVER_IP=$(hostname -I | awk '{print $1}')

# Создаем production конфигурацию
sudo -u rentadmin tee .env.production > /dev/null << EOF
VITE_API_URL=http://$SERVER_IP/api
NODE_ENV=production
EOF

# Установка зависимостей и сборка
sudo -u rentadmin npm install
sudo -u rentadmin npm run build

# Копируем в nginx
sudo cp -r dist/* /var/www/html/rentadmin/
```

### 7️⃣ Настройка nginx

```bash
cd /opt/rentadmin

# Применяем конфигурацию nginx
sudo cp nginx-cloud-http.conf /etc/nginx/nginx.conf

# Проверяем конфигурацию
sudo nginx -t

# Перезапускаем nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 8️⃣ Создание systemd сервиса

```bash
# Создаем сервис для бэкенда
sudo tee /etc/systemd/system/rentadmin.service > /dev/null << EOF
[Unit]
Description=RentAdmin Backend
After=network.target

[Service]
Type=simple
User=rentadmin
WorkingDirectory=/opt/rentadmin/backend
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=JWT_SECRET=super-secret-jwt-key-for-rent-admin-production-2024
Environment=PIN_CODE=20031997
Environment=CORS_ORIGIN=*
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/rentadmin/backend.log
StandardError=append:/var/log/rentadmin/backend-error.log

[Install]
WantedBy=multi-user.target
EOF

# Запускаем сервис
sudo systemctl daemon-reload
sudo systemctl enable rentadmin
sudo systemctl start rentadmin
```

---

## 📊 Проверка развертывания

### Проверка сервисов
```bash
# Статус бэкенда
sudo systemctl status rentadmin

# Статус nginx
sudo systemctl status nginx

# Проверка портов
sudo netstat -tlnp | grep ':80\|:3001'
```

### Тестирование API
```bash
# Получаем IP сервера
SERVER_IP=$(hostname -I | awk '{print $1}')

# Проверяем health endpoint
curl http://$SERVER_IP/health
curl http://$SERVER_IP/api/health

# Проверяем фронтенд
curl -I http://$SERVER_IP/
```

### Ожидаемые результаты
```json
// http://ВАШ_IP/health
{"status":"OK","timestamp":"2024-XX-XX","environment":"production"}

// http://ВАШ_IP/api/health
{"status":"OK","timestamp":"2024-XX-XX","environment":"production","cors":"handled by backend"}
```

---

## 🔧 Управление приложением

### Запуск и остановка
```bash
# Перезапуск бэкенда
sudo systemctl restart rentadmin

# Перезапуск nginx
sudo systemctl restart nginx

# Остановка всех сервисов
sudo systemctl stop rentadmin nginx

# Запуск всех сервисов
sudo systemctl start rentadmin nginx
```

### Просмотр логов
```bash
# Логи бэкенда (realtime)
tail -f /var/log/rentadmin/backend.log

# Логи systemd
journalctl -u rentadmin -f

# Логи nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Обновление приложения
```bash
# Остановка приложения
sudo systemctl stop rentadmin

# Обновление кода
cd /opt/rentadmin
sudo -u rentadmin git pull  # или скопируйте новые файлы

# Сборка бэкенда
cd backend
sudo -u rentadmin npm run build

# Сборка фронтенда
cd ../frontend
sudo -u rentadmin npm run build
sudo cp -r dist/* /var/www/html/rentadmin/

# Перезапуск
sudo systemctl start rentadmin
sudo systemctl restart nginx
```

---

## 🔒 Безопасность

### Рекомендации по безопасности
```bash
# Смена пароля пользователя rentadmin
sudo passwd rentadmin

# Настройка SSH ключей (рекомендуется)
sudo mkdir -p /home/rentadmin/.ssh
sudo chown rentadmin:rentadmin /home/rentadmin/.ssh
sudo chmod 700 /home/rentadmin/.ssh

# Проверка файрвола
sudo ufw status verbose
```

### Мониторинг безопасности
```bash
# Проверка активных соединений
sudo netstat -tlnp

# Проверка процессов
ps aux | grep -E 'nginx|node'

# Проверка логов на ошибки
sudo grep -i error /var/log/nginx/error.log
sudo grep -i error /var/log/rentadmin/backend-error.log
```

---

## 🆘 Устранение проблем

### Проблема: Бэкенд не запускается
```bash
# Проверяем логи
journalctl -u rentadmin -n 50

# Проверяем права на файлы
ls -la /opt/rentadmin/backend/

# Проверяем базу данных
ls -la /opt/rentadmin/backend/*.sqlite3

# Ручной запуск для диагностики
cd /opt/rentadmin/backend
sudo -u rentadmin NODE_ENV=production npm start
```

### Проблема: Nginx не отдает фронтенд
```bash
# Проверяем конфигурацию
sudo nginx -t

# Проверяем файлы фронтенда
ls -la /var/www/html/rentadmin/

# Проверяем права
sudo chown -R www-data:www-data /var/www/html/rentadmin/

# Перезапуск nginx
sudo systemctl restart nginx
```

### Проблема: API недоступен
```bash
# Проверяем что бэкенд слушает порт 3001
sudo netstat -tlnp | grep 3001

# Проверяем proxy в nginx
sudo nginx -T | grep -A 10 "location /api"

# Тестируем прямое подключение к бэкенду
curl http://localhost:3001/api/health
```

### Проблема: CORS ошибки
```bash
# Проверяем CORS заголовки
curl -I http://ВАШ_IP/api/health

# Должны быть заголовки:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

## 📞 Поддержка

### Полезные команды для диагностики
```bash
# Общий статус системы
sudo systemctl status rentadmin nginx

# Использование ресурсов
htop
df -h
free -h

# Сетевые соединения
sudo ss -tlnp

# Версии ПО
node -v
npm -v
nginx -v
```

### Контакты для получения помощи
- Документация nginx: https://nginx.org/ru/docs/
- Документация Node.js: https://nodejs.org/docs/
- Логи системы: `journalctl -f`

---

## 🎉 Готово!

После успешного развертывания ваше приложение RentAdmin будет доступно по адресу:

**🌍 http://ВАШ_IP_СЕРВЕРА/**

Приложение автоматически запустится при перезагрузке сервера и будет работать стабильно в production режиме.
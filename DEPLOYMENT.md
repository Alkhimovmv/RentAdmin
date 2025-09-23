# 🚀 Руководство по развертыванию RentAdmin

## 📋 Обзор
Этот документ содержит пошаговые инструкции по развертыванию приложения RentAdmin:
- **Backend**: Yandex Cloud (Compute Cloud + Managed PostgreSQL)
- **Frontend**: Netlify

## 🔧 Предварительная подготовка

### Требования:
- Аккаунт в Yandex Cloud
- Аккаунт в Netlify
- Docker (для локального тестирования)
- Git
- Node.js 18+

## 🗄️ Настройка базы данных (Yandex Cloud)

### 1. Создание Managed PostgreSQL
```bash
# Через Yandex Cloud Console или CLI
yc managed-postgresql cluster create \
  --name rent-admin-db \
  --environment production \
  --network-name default \
  --host zone-id=ru-central1-a,subnet-id=<your-subnet-id> \
  --postgresql-version 15 \
  --user name=admin,password=<secure-password> \
  --database name=rent_admin_prod,owner=admin \
  --disk-size 20GB \
  --disk-type network-ssd \
  --resource-preset s2.micro
```

### 2. Настройка доступа
- Получите хост базы данных из консоли Yandex Cloud
- Настройте SSL-соединение
- Обновите файл `.env.production`

## 🖥️ Развертывание Backend (Yandex Cloud)

### 1. Создание Compute Cloud инстанса
```bash
yc compute instance create \
  --name rent-admin-backend \
  --zone ru-central1-a \
  --network-interface subnet-name=default,nat-ip-version=ipv4 \
  --create-boot-disk image-folder-id=standard-images,image-family=ubuntu-2004-lts,size=20GB \
  --ssh-key ~/.ssh/id_rsa.pub \
  --memory 2GB \
  --cores 1
```

### 2. Настройка сервера
```bash
# Подключение к серверу
ssh yc-user@<your-server-ip>

# Установка Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Развертывание приложения
```bash
# Клонирование репозитория
git clone <your-repo-url>
cd RentAdmin

# Настройка переменных окружения
cp backend/.env.production backend/.env
# Отредактируйте .env файл с реальными данными

# Сборка и запуск
docker-compose -f docker-compose.prod.yml up -d

# Запуск миграций
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
```

### 4. Настройка файерволла
```bash
# Открытие портов
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

## 🌐 Развертывание Frontend (Netlify)

### 1. Подготовка проекта
```bash
# Обновите .env.production с реальным URL API
cd frontend
nano .env.production
```

### 2. Развертывание через Git
1. Подключите репозиторий к Netlify
2. Настройте build команды:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### 3. Настройка переменных окружения в Netlify
В настройках сайта добавьте:
```
VITE_API_URL=https://your-backend-domain.yandexcloud.net/api
```

### 4. Настройка кастомного домена (опционально)
1. Добавьте домен в настройках Netlify
2. Настройте DNS записи
3. Включите HTTPS

## 🔐 Безопасность и мониторинг

### SSL/TLS сертификаты
```bash
# Установка Certbot для Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Мониторинг
```bash
# Логи приложения
docker-compose -f docker-compose.prod.yml logs -f backend

# Состояние сервисов
docker-compose -f docker-compose.prod.yml ps

# Health check
curl https://your-backend-domain.yandexcloud.net/api/health
```

## 🔄 Обновление приложения

### Backend
```bash
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Frontend
- Просто пушьте изменения в main ветку
- Netlify автоматически пересоберет и задеплоит

## 📊 Настройка бэкапов

### Автоматический бэкап PostgreSQL
```bash
# Создайте скрипт backup.sh
#!/bin/bash
BACKUP_DIR="/home/yc-user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h <db-host> -U admin -d rent_admin_prod > $BACKUP_DIR/backup_$DATE.sql

# Добавьте в crontab
crontab -e
# 0 2 * * * /path/to/backup.sh
```

## 🐛 Устранение неполадок

### Проверка логов
```bash
# Backend логи
docker-compose -f docker-compose.prod.yml logs backend

# Системные логи
sudo journalctl -u docker
```

### Проверка подключения к БД
```bash
# Тест подключения
docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
```

### Проверка API
```bash
# Health check
curl -X GET https://your-api-url.com/api/health

# Проверка CORS
curl -H "Origin: https://your-frontend-url.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS https://your-api-url.com/api/health
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи приложения
2. Убедитесь в правильности переменных окружения
3. Проверьте сетевые настройки и файерволл
4. Проверьте SSL сертификаты

## 🎯 Оптимизация производительности

### Backend
- Используйте connection pooling для БД
- Настройте кэширование Redis (опционально)
- Мониторинг ресурсов сервера

### Frontend
- Включите gzip сжатие в Netlify
- Используйте CDN для статических ресурсов
- Мониторинг производительности через Lighthouse

---

✅ **Готово!** Ваше приложение RentAdmin теперь работает в продакшене.
# 🚀 Развертывание RentAdmin на Cloud.ru + Netlify

## 🎯 Архитектура решения

**Cloud.ru (Backend):**
- Backend API (Node.js + Express + TypeScript)
- PostgreSQL база данных
- Nginx как reverse proxy с SSL

**Netlify (Frontend):**
- React приложение (статические файлы)
- CDN для быстрой загрузки
- Автоматические деплои из Git

---

## 📋 Пошаговое руководство

### 🔧 Шаг 1: Подготовка сервера на Cloud.ru

1. **Создайте виртуальную машину:**
   - Ubuntu 20.04 LTS или выше
   - Минимум 2 ГБ RAM, 2 CPU
   - 20+ ГБ дискового пространства

2. **Подключитесь к серверу:**
   ```bash
   ssh user@your-server-ip
   ```

3. **Установите Docker и Docker Compose:**
   ```bash
   # Обновление системы
   sudo apt update && sudo apt upgrade -y

   # Установка Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER

   # Установка Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Перезагрузка для применения изменений
   sudo reboot
   ```

### 📂 Шаг 2: Загрузка кода на сервер

```bash
# Клонирование репозитория
git clone <your-repository-url>
cd RentAdmin

# Или загрузка через scp если репозиторий приватный
# scp -r ./RentAdmin user@your-server-ip:/home/user/
```

### ⚙️ Шаг 3: Настройка переменных окружения

```bash
# Копирование шаблона переменных окружения
cp .env.cloud .env

# Редактирование переменных
nano .env
```

**Обязательно измените:**
```env
# Безопасные пароли
DB_PASSWORD=your-super-secure-database-password
JWT_SECRET=your-super-secure-jwt-secret-key-256-bit

# URL вашего фронтенда на Netlify (будет известен после настройки Netlify)
FRONTEND_URL=https://your-app-name.netlify.app
CORS_ORIGIN=https://your-app-name.netlify.app
```

### 🔐 Шаг 4: Настройка SSL сертификатов

**Вариант 1: Самоподписанные (для тестирования):**
```bash
# Создание папки для сертификатов
mkdir -p nginx/ssl

# Генерация самоподписанного сертификата
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=RentAdmin/CN=your-domain.com"
```

**Вариант 2: Let's Encrypt (для продакшена):**
```bash
# Получение реального сертификата после настройки домена
sudo certbot certonly --standalone -d your-domain.com
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

### 🚀 Шаг 5: Развертывание

```bash
# Запуск автоматического скрипта развертывания
./deploy-cloud.sh
```

Или вручную:
```bash
# Сборка и запуск
docker-compose -f docker-compose.cloud.yml up -d

# Проверка статуса
docker-compose -f docker-compose.cloud.yml ps

# Проверка логов
docker-compose -f docker-compose.cloud.yml logs backend
```

### 🌐 Шаг 6: Настройка Netlify

1. **Подключите репозиторий к Netlify:**
   - Зайдите на [netlify.com](https://netlify.com)
   - New site from Git → выберите ваш репозиторий

2. **Настройки сборки:**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

3. **Переменные окружения в Netlify:**
   ```
   VITE_API_URL=https://your-server-ip/api
   ```
   (Замените на ваш реальный IP или домен)

4. **Обновите .env на сервере:**
   ```bash
   # На сервере Cloud.ru обновите FRONTEND_URL и CORS_ORIGIN
   nano .env

   # Перезапустите backend
   docker-compose -f docker-compose.cloud.yml restart backend
   ```

---

## 🔍 Проверка работоспособности

### Backend проверки:
```bash
# Health check API
curl -k https://your-server-ip/health

# Проверка API
curl -k https://your-server-ip/api/health

# Проверка логов
docker-compose -f docker-compose.cloud.yml logs backend
```

### Frontend проверки:
1. Откройте ваш сайт на Netlify
2. Проверьте Developer Tools → Network
3. Убедитесь, что запросы идут на правильный API

---

## 🛠️ Управление и обслуживание

### Обновление приложения:
```bash
# На сервере
git pull origin main
docker-compose -f docker-compose.cloud.yml build
docker-compose -f docker-compose.cloud.yml up -d

# Фронтенд обновится автоматически при push в main ветку
```

### Мониторинг:
```bash
# Статус сервисов
docker-compose -f docker-compose.cloud.yml ps

# Использование ресурсов
docker stats

# Логи
docker-compose -f docker-compose.cloud.yml logs -f --tail=100
```

### Резервное копирование:
```bash
# Бэкап базы данных
docker-compose -f docker-compose.cloud.yml exec database pg_dump -U postgres rent_admin > backup.sql

# Восстановление
docker-compose -f docker-compose.cloud.yml exec -T database psql -U postgres rent_admin < backup.sql
```

---

## 🔐 Безопасность

### Файерволл:
```bash
# Установка ufw
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

### Обновления:
```bash
# Регулярные обновления системы
sudo apt update && sudo apt upgrade -y

# Обновление Docker образов
docker-compose -f docker-compose.cloud.yml pull
docker-compose -f docker-compose.cloud.yml up -d
```

---

## ❗ Устранение неполадок

### Проблемы с CORS:
1. Проверьте CORS_ORIGIN в .env
2. Убедитесь, что URL совпадают
3. Перезапустите backend: `docker-compose -f docker-compose.cloud.yml restart backend`

### Проблемы с SSL:
1. Проверьте файлы cert.pem и key.pem в nginx/ssl/
2. Убедитесь, что права на файлы корректные
3. Проверьте логи nginx: `docker-compose -f docker-compose.cloud.yml logs nginx`

### Проблемы с базой данных:
1. Проверьте пароли в .env
2. Проверьте логи: `docker-compose -f docker-compose.cloud.yml logs database`
3. Проверьте миграции: `docker-compose -f docker-compose.cloud.yml exec backend npm run db:migrate`

---

## 🎉 Готово!

После выполнения всех шагов у вас будет:

✅ **Backend на Cloud.ru:** `https://your-server-ip/api`
✅ **Frontend на Netlify:** `https://your-app-name.netlify.app`
✅ **Безопасное HTTPS соединение**
✅ **Автоматические деплои фронтенда**
✅ **Масштабируемая архитектура**

**Полезные ссылки:**
- Файлы конфигурации: `docker-compose.cloud.yml`, `nginx/nginx.conf`
- Скрипт развертывания: `deploy-cloud.sh`
- Настройка Netlify: `NETLIFY_SETUP.md`
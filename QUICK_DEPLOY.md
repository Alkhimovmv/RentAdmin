# ⚡ Быстрое развертывание RentAdmin

## 🎯 Краткий чек-лист

### 1. Подготовка (5 мин)
```bash
# Клонируйте репозиторий
git clone <your-repo>
cd RentAdmin

# Настройте переменные окружения
cp backend/.env.example backend/.env.production
# Отредактируйте .env.production с реальными данными
```

### 2. Backend → Yandex Cloud (15 мин)

#### Создайте PostgreSQL:
- Yandex Cloud Console → Managed Service for PostgreSQL
- Создайте кластер с SSL
- Получите строку подключения

#### Создайте VM:
- Compute Cloud → Create Instance (Ubuntu 20.04, 2GB RAM)
- Установите Docker и Docker Compose
- Загрузите код и запустите: `./deploy.sh`

### 3. Frontend → Netlify (5 мин)

#### Автоматический деплой:
1. Подключите GitHub репозиторий к Netlify
2. Build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. Environment variables:
   - `VITE_API_URL` = `https://your-vm-ip.yandexcloud.net/api`

## 📋 Необходимые данные

### Для .env.production:
```env
DB_HOST=c-*****.mdb.yandexcloud.net
DB_PORT=6432
DB_NAME=rent_admin_prod
DB_USER=admin
DB_PASSWORD=your_secure_password
JWT_SECRET=your-32-char-secret
CORS_ORIGIN=https://your-app.netlify.app
```

### Стоимость (примерно):
- PostgreSQL: ~500₽/месяц
- Compute Cloud: ~800₽/месяц
- Netlify: Бесплатно
- **Итого**: ~1300₽/месяц

## 🚀 Команды для запуска

```bash
# Развертывание backend
./deploy.sh

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Остановка
docker-compose -f docker-compose.prod.yml down
```

## ✅ Проверка работы

1. **Backend**: `curl https://your-vm-ip/api/health`
2. **Frontend**: Откройте `https://your-app.netlify.app`
3. **Полная интеграция**: Войдите в приложение и создайте аренду

---
**📚 Полное руководство**: См. [DEPLOYMENT.md](./DEPLOYMENT.md)
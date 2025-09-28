# 🚀 Развертывание RentAdmin на cloud.ru

## Быстрый старт

### 1. Подключение к серверу
```bash
ssh root@87.242.103.146
```

### 2. Скачивание проекта
```bash
# Создание директории проекта
mkdir -p /opt/rentadmin
cd /opt/rentadmin

# Скачивание файлов проекта (один из способов):

# Вариант А: Через wget/curl (если есть архив)
wget <URL_TO_PROJECT_ARCHIVE>
unzip <archive_name>

# Вариант Б: Через git (если настроен репозиторий)
git clone <repository_url> .

# Вариант В: Через scp с локальной машины
# scp -r /path/to/RentAdmin root@87.242.103.146:/opt/rentadmin/
```

### 3. Запуск автоматического развертывания
```bash
cd /opt/rentadmin
chmod +x deploy-to-server.sh
./deploy-to-server.sh
```

Скрипт автоматически:
- ✅ Установит Docker и Docker Compose
- ✅ Настроит файрвол
- ✅ Соберет frontend
- ✅ Запустит все сервисы
- ✅ Настроит nginx

### 4. Проверка работы
После завершения установки приложение будет доступно:
- **Frontend**: http://87.242.103.146
- **API**: http://87.242.103.146/api
- **Health check**: http://87.242.103.146/health

## 🔧 Управление приложением

### Основные команды
```bash
cd /opt/rentadmin

# Просмотр статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f

# Перезапуск
docker-compose restart

# Остановка
docker-compose down

# Полная остановка с удалением данных
docker-compose down -v
```

### Обновление приложения
```bash
cd /opt/rentadmin
./update-production.sh
```

### Мониторинг ресурсов
```bash
# Использование ресурсов контейнерами
docker stats

# Дисковое пространство
df -h

# Логи системы
sudo journalctl -u docker -f
```

## 🔐 Настройки безопасности

### Изменение секретных ключей
Отредактируйте файл `docker-compose.yml`:
```yaml
environment:
  - JWT_SECRET=your-new-secret-here
  - PIN_CODE=your-new-pin-here
```

Затем перезапустите:
```bash
docker-compose down
docker-compose up -d
```

### Настройка HTTPS (опционально)
1. Получите SSL сертификат (Let's Encrypt)
2. Обновите `nginx.conf` для HTTPS
3. Перезапустите nginx контейнер

## 📊 Структура проекта

```
/opt/rentadmin/
├── docker-compose.yml      # Конфигурация Docker
├── nginx.conf             # Конфигурация nginx
├── .env.production        # Переменные окружения
├── deploy-to-server.sh    # Скрипт развертывания
├── update-production.sh   # Скрипт обновления
├── backend/              # Backend приложение
│   ├── Dockerfile
│   └── ...
├── frontend/             # Frontend приложение
│   ├── dist/            # Собранные файлы
│   └── ...
└── data/                # База данных SQLite
    └── production.sqlite3
```

## 🐛 Устранение неполадок

### Проблема: Контейнер не запускается
```bash
# Проверка логов
docker-compose logs backend
docker-compose logs nginx

# Проверка портов
netstat -tulpn | grep :80
netstat -tulpn | grep :3001
```

### Проблема: База данных недоступна
```bash
# Проверка файла БД
ls -la data/production.sqlite3

# Проверка прав доступа
sudo chown -R 1001:1001 data/
```

### Проблема: Frontend не загружается
```bash
# Пересборка frontend
cd frontend
npm run build
docker-compose restart nginx
```

### Проблема: CORS ошибки
Проверьте настройки в `nginx.conf` и `docker-compose.yml`:
- CORS_ORIGIN должен соответствовать IP сервера
- Nginx должен правильно проксировать API запросы

## 📝 Логи и мониторинг

### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f nginx

# Последние N строк
docker-compose logs --tail=50 backend
```

### Мониторинг производительности
```bash
# Статистика контейнеров
docker stats

# Использование диска
du -sh data/
df -h
```

## 🔄 Резервное копирование

### Создание бэкапа
```bash
# Остановка приложения
docker-compose down

# Создание бэкапа БД
cp data/production.sqlite3 backups/backup-$(date +%Y%m%d-%H%M%S).sqlite3

# Запуск приложения
docker-compose up -d
```

### Восстановление из бэкапа
```bash
docker-compose down
cp backups/backup-YYYYMMDD-HHMMSS.sqlite3 data/production.sqlite3
docker-compose up -d
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs -f`
2. Проверьте статус: `docker-compose ps`
3. Проверьте конфигурацию nginx: `nginx -t`
4. Перезапустите сервисы: `docker-compose restart`

## 🌐 Доступ к приложению

После успешного развертывания:
- **URL**: http://87.242.103.146
- **PIN-код для входа**: 20031997

**Важно**: Измените PIN-код в production!
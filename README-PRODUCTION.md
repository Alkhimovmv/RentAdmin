# 🚀 RentAdmin - Production Deployment

Готовая к развертыванию система управления арендой оборудования с полной настройкой Docker, nginx и автоматизацией.

## 📋 Что включено в production-конфигурацию

### ✅ Docker Infrastructure
- **Backend Container**: Node.js приложение с оптимизированным Dockerfile
- **Nginx Container**: Веб-сервер с настроенным проксированием
- **SQLite Database**: Надежное хранение данных
- **Health Checks**: Автоматический мониторинг состояния
- **Restart Policies**: Автоматический перезапуск при сбоях

### ✅ Security Features
- **CORS Protection**: Настроенные заголовки безопасности
- **Rate Limiting**: Защита от DDoS атак
- **Non-root User**: Контейнеры работают без root прав
- **Security Headers**: X-Frame-Options, X-XSS-Protection и др.
- **Firewall Configuration**: UFW настройка портов

### ✅ Production Ready
- **Optimized Build**: Минификация и сжатие ресурсов
- **Static Assets**: Эффективная раздача статики через nginx
- **Logging**: Структурированные логи для мониторинга
- **Environment Variables**: Безопасное управление конфигурацией

## 🎯 Быстрое развертывание

### 1. Подключитесь к серверу cloud.ru
```bash
ssh root@87.242.103.146
```

### 2. Загрузите проект на сервер
```bash
# Создание рабочей директории
mkdir -p /opt/rentadmin
cd /opt/rentadmin

# Загрузка проекта (выберите один способ):

# Способ А: Через scp с вашего компьютера
# scp -r /path/to/RentAdmin/* root@87.242.103.146:/opt/rentadmin/

# Способ Б: Через wget (если есть архив)
# wget <URL_TO_PROJECT_ARCHIVE> && unzip <archive>

# Способ В: Через git (если настроен репозиторий)
# git clone <YOUR_REPO_URL> .
```

### 3. Запустите автоматическое развертывание
```bash
chmod +x deploy-to-server.sh
./deploy-to-server.sh
```

### 4. Готово! 🎉
Приложение будет доступно по адресу: **http://87.242.103.146**

## 📁 Структура проекта для production

```
RentAdmin/
├── 🐳 docker-compose.yml          # Orchestration
├── 🌐 nginx.conf                  # Web server config
├── 🔧 .env.production             # Environment variables
├── 📜 deploy-to-server.sh         # Full deployment script
├── 🔄 update-production.sh        # Quick update script
├── 📖 DEPLOYMENT.md               # Detailed instructions
├── backend/
│   ├── 🐳 Dockerfile              # Backend container
│   ├── 📊 dev.sqlite3             # Database file
│   └── ...
├── frontend/
│   ├── 🎨 dist/                   # Built static files
│   ├── ⚙️ vite.config.ts          # Build configuration
│   └── ...
└── 📚 README-PRODUCTION.md        # This file
```

## 🔧 Управление приложением

### Основные команды
```bash
cd /opt/rentadmin

# Статус сервисов
docker-compose ps

# Просмотр логов
docker-compose logs -f

# Перезапуск
docker-compose restart

# Остановка
docker-compose down

# Обновление
./update-production.sh
```

### Мониторинг
```bash
# Использование ресурсов
docker stats

# Дисковое пространство
df -h

# Системные логи
journalctl -u docker -f
```

## 🌍 Доступ к приложению

После развертывания:

- **🌐 Веб-интерфейс**: http://87.242.103.146
- **🔌 API**: http://87.242.103.146/api
- **❤️ Health Check**: http://87.242.103.146/health
- **🔐 PIN-код**: 20031997

## 🔐 Настройки безопасности

### Обязательно измените в production:

1. **JWT Secret** в `docker-compose.yml`:
```yaml
environment:
  - JWT_SECRET=ваш-новый-секретный-ключ-здесь
```

2. **PIN-код** в `docker-compose.yml`:
```yaml
environment:
  - PIN_CODE=ваш-новый-пин-код
```

3. **Перезапустите** после изменений:
```bash
docker-compose down && docker-compose up -d
```

## 🚨 Устранение неполадок

### Проблема: Сайт недоступен
```bash
# Проверка статуса контейнеров
docker-compose ps

# Проверка логов nginx
docker-compose logs nginx

# Проверка портов
netstat -tulpn | grep :80
```

### Проблема: API не работает
```bash
# Проверка логов backend
docker-compose logs backend

# Проверка health check
curl http://localhost/health
```

### Проблема: База данных
```bash
# Проверка файла БД
ls -la backend/dev.sqlite3

# Восстановление прав
sudo chown -R 1001:1001 backend/
```

## 📦 Что делает скрипт deploy-to-server.sh

1. **🔧 Установка системы**:
   - Обновление Ubuntu
   - Установка Docker & Docker Compose
   - Настройка файрвола UFW

2. **🏗️ Сборка приложения**:
   - Установка Node.js
   - Сборка frontend с production настройками
   - Подготовка базы данных

3. **🚀 Запуск сервисов**:
   - Сборка Docker образов
   - Запуск всех контейнеров
   - Проверка работоспособности

4. **✅ Верификация**:
   - Health checks
   - Тестирование доступности
   - Отображение статуса

## 📞 Поддержка

### Логи для диагностики:
```bash
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только nginx
docker-compose logs -f nginx

# Системные логи
journalctl -f
```

### Резервное копирование:
```bash
# Создание бэкапа БД
cp backend/dev.sqlite3 backup-$(date +%Y%m%d).sqlite3

# Восстановление
cp backup-YYYYMMDD.sqlite3 backend/dev.sqlite3
docker-compose restart backend
```

## 🎯 Следующие шаги

После успешного развертывания рекомендуется:

1. ✅ **Изменить секретные ключи**
2. ✅ **Настроить регулярные бэкапы**
3. ✅ **Настроить мониторинг**
4. ✅ **Добавить SSL сертификат** (Let's Encrypt)
5. ✅ **Настроить доменное имя** (опционально)

---

**🎉 Ваше приложение RentAdmin готово к работе в production!**

Доступ: http://87.242.103.146 | PIN: 20031997
# Безопасность и восстановление базы данных

## ✅ Что было сделано

### 1. Nullable поля для цен
- Создана миграция `20241010000004_make_prices_nullable.js`
- Поля `rental_price`, `delivery_price`, `delivery_costs` теперь могут быть пустыми
- Применить: `cd backend && npm run db:migrate`

### 2. Автоматические бэкапы
- Скрипт бэкапа: `backend/scripts/backup-db.sh`
- Скрипт восстановления: `backend/scripts/restore-db.sh`
- Бэкапы сохраняются в `backend/backups/`
- Старые бэкапы удаляются автоматически (>30 дней)

### 3. Исправлен .gitignore
- Добавлены `*.pid`, `backend.pid`, `frontend.pid`
- Добавлены `backups/`, `*.sql`, `*.sql.gz`
- Git больше не будет ругаться на эти файлы

### 4. Скрипты не удаляют базу
- Проверены все скрипты деплоя
- База данных сохраняется при перезапуске
- Скрипт `deploy-vm.sh` НЕ удаляет базу данных

## 🔧 Использование

### Установка PostgreSQL client tools (требуется один раз)

```bash
# Ubuntu/Debian
sudo apt install postgresql-client

# MacOS
brew install postgresql
```

### Создать бэкап вручную
```bash
cd backend
npm run db:backup
```

### Восстановить из бэкапа
```bash
cd backend
npm run db:restore backups/rent_admin_ДАТА.sql.gz
```

### Применить миграцию для nullable полей
```bash
cd backend
npm run db:migrate
```

## ⚙️ Настройка автоматических бэкапов

### На сервере добавьте в crontab:

```bash
# Редактировать crontab
crontab -e

# Ежедневный бэкап в 3:00 ночи
0 3 * * * cd /home/maxim/RentAdmin/backend && ./scripts/backup-db.sh >> /home/maxim/RentAdmin/backend/backups/cron.log 2>&1

# Или каждые 6 часов (надежнее)
0 */6 * * * cd /home/maxim/RentAdmin/backend && ./scripts/backup-db.sh >> /home/maxim/RentAdmin/backend/backups/cron.log 2>&1
```

## 📋 Чеклист безопасности

- ✅ Nullable поля созданы (миграция готова)
- ✅ Скрипты бэкапа созданы и настроены
- ✅ .gitignore обновлен (backend.pid, backups)
- ✅ Скрипты деплоя не удаляют базу
- ⚠️ **TODO**: Настроить cron для автоматических бэкапов
- ⚠️ **TODO**: Применить миграцию на сервере
- ⚠️ **TODO**: Обновить формы для пустых значений

## 🚨 Что делать при потере данных

1. Остановите сервер
2. Найдите последний бэкап: `ls -lh backend/backups/`
3. Восстановите: `cd backend && npm run db:restore backups/ФАЙЛ.sql.gz`
4. Запустите сервер

## 📚 Подробная документация

См. [backend/scripts/README.md](backend/scripts/README.md)

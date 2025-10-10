# Скрипты управления базой данных

## Бэкапы базы данных

### Создание бэкапа вручную

```bash
cd backend
npm run db:backup
```

Или напрямую:
```bash
./scripts/backup-db.sh
```

Бэкапы сохраняются в `backend/backups/` с именем вида `rent_admin_YYYYMMDD_HHMMSS.sql.gz`

### Восстановление из бэкапа

```bash
cd backend
npm run db:restore backups/rent_admin_20241010_120000.sql.gz
```

Или напрямую:
```bash
./scripts/restore-db.sh backups/rent_admin_20241010_120000.sql.gz
```

### Автоматические бэкапы

Для настройки автоматических ежедневных бэкапов добавьте в crontab:

```bash
# Редактировать crontab
crontab -e

# Добавить строку для ежедневного бэкапа в 3:00 ночи
0 3 * * * cd /home/maxim/RentAdmin/backend && ./scripts/backup-db.sh >> /home/maxim/RentAdmin/backend/backups/cron.log 2>&1
```

Или для более частых бэкапов (каждые 6 часов):
```bash
0 */6 * * * cd /home/maxim/RentAdmin/backend && ./scripts/backup-db.sh >> /home/maxim/RentAdmin/backend/backups/cron.log 2>&1
```

### Хранение бэкапов

- Бэкапы автоматически сжимаются (gzip)
- Старые бэкапы (>30 дней) удаляются автоматически
- Бэкапы исключены из git (.gitignore)

### Проверка бэкапов

```bash
# Список всех бэкапов
ls -lh backend/backups/

# Посмотреть содержимое бэкапа
zcat backend/backups/rent_admin_20241010_120000.sql.gz | less
```

## Миграции

### Применить миграции
```bash
cd backend
npm run db:migrate
```

### Откатить миграции и применить заново
```bash
cd backend
npm run db:reset
```

⚠️ **ВНИМАНИЕ**: `db:reset` удаляет все данные! Создавайте бэкап перед использованием.

## Рекомендации

1. **Перед деплоем** всегда создавайте бэкап
2. **Настройте cron** для автоматических бэкапов
3. **Периодически проверяйте** работоспособность восстановления из бэкапа
4. **Храните копии** важных бэкапов отдельно от сервера

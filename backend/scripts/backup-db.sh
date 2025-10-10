#!/bin/bash

# Скрипт для автоматического бэкапа базы данных PostgreSQL

# Загружаем переменные окружения
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# Настройки
BACKUP_DIR="/home/maxim/RentAdmin/backend/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rent_admin_$DATE.sql"
KEEP_DAYS=30  # Хранить бэкапы за последние 30 дней

# Создаем директорию для бэкапов, если её нет
mkdir -p "$BACKUP_DIR"

# Параметры подключения
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-rent_admin}
DB_USER=${DB_USER:-postgres}

echo "Starting backup of database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Создаем бэкап
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F p -f "$BACKUP_FILE"

# Проверяем успешность бэкапа
if [ $? -eq 0 ]; then
    echo "Backup completed successfully!"

    # Сжимаем бэкап
    gzip "$BACKUP_FILE"
    echo "Backup compressed: ${BACKUP_FILE}.gz"

    # Удаляем старые бэкапы (старше KEEP_DAYS дней)
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$KEEP_DAYS -delete
    echo "Old backups cleaned up (older than $KEEP_DAYS days)"

    # Показываем размер бэкапа
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"

    # Подсчитываем количество оставшихся бэкапов
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
    echo "Total backups: $BACKUP_COUNT"
else
    echo "Backup failed!"
    exit 1
fi

#!/bin/bash

# Скрипт для восстановления базы данных из бэкапа

# Загружаем переменные окружения
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

BACKUP_DIR="/home/maxim/RentAdmin/backend/backups"

# Параметры подключения
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-rent_admin}
DB_USER=${DB_USER:-postgres}

# Проверяем, передан ли файл бэкапа
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Проверяем существование файла
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will DROP and RECREATE the database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo "Restoring database from backup..."

# Распаковываем, если файл сжат
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
else
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "Database restored successfully!"
else
    echo "Restore failed!"
    exit 1
fi

#!/bin/bash

# Скрипт для восстановления базы данных из бэкапа

# Получаем директорию скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Загружаем переменные окружения
if [ -f "$BACKEND_DIR/.env" ]; then
    export $(cat "$BACKEND_DIR/.env" | grep -v '^#' | xargs)
fi

BACKUP_DIR="$BACKEND_DIR/backups"

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

# Проверяем, запущена ли база в Docker
DOCKER_CONTAINER=$(docker ps --filter "name=postgres" --filter "status=running" -q | head -n 1)

if [ ! -z "$DOCKER_CONTAINER" ]; then
    echo "📦 Using Docker container: $DOCKER_CONTAINER"
    # Восстанавливаем через Docker
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        echo "Decompressing backup file..."
        gunzip -c "$BACKUP_FILE" | docker exec -i $DOCKER_CONTAINER psql -U $DB_USER -d $DB_NAME
    else
        docker exec -i $DOCKER_CONTAINER psql -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"
    fi
else
    echo "🔌 Using direct PostgreSQL connection"
    # Восстанавливаем через прямое подключение
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        echo "Decompressing backup file..."
        gunzip -c "$BACKUP_FILE" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
    else
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"
    fi
fi

if [ $? -eq 0 ]; then
    echo "Database restored successfully!"
else
    echo "Restore failed!"
    exit 1
fi

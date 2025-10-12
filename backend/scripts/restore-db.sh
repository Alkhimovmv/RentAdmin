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

# Определяем тип базы данных (как в backup-db.sh)
DB_TYPE="unknown"
SQLITE_DB=""

echo "🔍 Detecting database type..."

# Проверяем наличие SQLite файлов
for db_file in "$BACKEND_DIR"/*.sqlite* "$BACKEND_DIR"/*.db "$BACKEND_DIR/data"/*.sqlite* "$BACKEND_DIR/database"/*.sqlite*; do
    if [ -f "$db_file" ] && [ -s "$db_file" ]; then
        SQLITE_DB="$db_file"
        DB_TYPE="sqlite"
        echo "✅ Found SQLite database: $db_file"
        break
    fi
done

# SQLite восстановление
if [ "$DB_TYPE" = "sqlite" ]; then
    echo ""
    echo "⚠️  WARNING: This will OVERWRITE the SQLite database: $SQLITE_DB"
    echo "📦 Backup file: $BACKUP_FILE"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        echo "Restore cancelled"
        exit 0
    fi

    echo ""
    echo "💾 Restoring SQLite database..."

    # Создаем резервную копию текущей БД на всякий случай
    CURRENT_BACKUP="$SQLITE_DB.before_restore_$(date +%Y%m%d_%H%M%S)"
    echo "📋 Creating safety backup: $CURRENT_BACKUP"
    cp "$SQLITE_DB" "$CURRENT_BACKUP"

    if ! command -v sqlite3 &> /dev/null; then
        echo "⚠️  sqlite3 not found, using file copy"

        # Если бэкап сжат
        if [[ "$BACKUP_FILE" == *.gz ]]; then
            echo "Decompressing backup file..."
            gunzip -c "$BACKUP_FILE" > "$SQLITE_DB"
        else
            cp "$BACKUP_FILE" "$SQLITE_DB"
        fi
    else
        # Восстановление через sqlite3
        if [[ "$BACKUP_FILE" == *.gz ]]; then
            echo "Decompressing and restoring..."
            # Удаляем старую БД и создаем новую из дампа
            rm -f "$SQLITE_DB"
            gunzip -c "$BACKUP_FILE" | sqlite3 "$SQLITE_DB"
        else
            rm -f "$SQLITE_DB"
            sqlite3 "$SQLITE_DB" < "$BACKUP_FILE"
        fi
    fi

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Database restored successfully!"
        echo "📁 Restored to: $SQLITE_DB"
        echo "🔒 Safety backup saved at: $CURRENT_BACKUP"
        echo ""
        echo "💡 If something went wrong, restore the safety backup:"
        echo "   cp $CURRENT_BACKUP $SQLITE_DB"
    else
        echo ""
        echo "❌ Restore failed!"
        echo "🔄 Restoring from safety backup..."
        cp "$CURRENT_BACKUP" "$SQLITE_DB"
        echo "✅ Original database restored"
        exit 1
    fi

# PostgreSQL восстановление
else
    echo "🐘 Using PostgreSQL database"

    # Параметры подключения
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_NAME=${DB_NAME:-rent_admin}
    DB_USER=${DB_USER:-postgres}

    echo ""
    echo "⚠️  WARNING: This will DROP and RECREATE the database: $DB_NAME"
    echo "📦 Backup file: $BACKUP_FILE"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        echo "Restore cancelled"
        exit 0
    fi

    echo ""
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

        # Проверка наличия psql
        if ! command -v psql &> /dev/null; then
            echo "❌ Error: psql not found!"
            echo ""
            echo "Please install PostgreSQL client tools:"
            echo "  Ubuntu/Debian: sudo apt install postgresql-client"
            echo "  MacOS: brew install postgresql"
            echo ""
            exit 1
        fi

        # Восстанавливаем через прямое подключение
        if [[ "$BACKUP_FILE" == *.gz ]]; then
            echo "Decompressing backup file..."
            gunzip -c "$BACKUP_FILE" | PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
        else
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < "$BACKUP_FILE"
        fi
    fi

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Database restored successfully!"
    else
        echo ""
        echo "❌ Restore failed!"
        exit 1
    fi
fi

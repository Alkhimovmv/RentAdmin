#!/bin/bash

# Скрипт для просмотра списка бэкапов

# Получаем директорию скрипта
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$BACKEND_DIR/backups"

# Проверяем наличие директории с бэкапами
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Директория с бэкапами не найдена: $BACKUP_DIR"
    exit 1
fi

# Подсчитываем количество бэкапов (все форматы)
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql.gz "$BACKUP_DIR"/*.sql.sqlite.gz 2>/dev/null | wc -l)

if [ $BACKUP_COUNT -eq 0 ]; then
    echo "📭 Нет доступных бэкапов"
    exit 0
fi

echo "📦 Всего бэкапов: $BACKUP_COUNT"
echo ""
echo "📋 Список бэкапов (от новых к старым):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Выводим список бэкапов (все форматы)
ls -lht "$BACKUP_DIR"/*.sql.gz "$BACKUP_DIR"/*.sql.sqlite.gz 2>/dev/null | awk '{
    size = $5
    date = $6 " " $7 " " $8
    filename = $9
    # Извлекаем имя файла без пути
    split(filename, parts, "/")
    name = parts[length(parts)]
    printf "  %-50s %8s  %s\n", name, size, date
}'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Показываем последний бэкап отдельно
echo ""
echo "🔹 Последний бэкап:"
LATEST=$(ls -t "$BACKUP_DIR"/*.sql.gz "$BACKUP_DIR"/*.sql.sqlite.gz 2>/dev/null | head -1)
if [ ! -z "$LATEST" ]; then
    LATEST_SIZE=$(du -h "$LATEST" | cut -f1)
    LATEST_DATE=$(stat -c %y "$LATEST" 2>/dev/null || stat -f "%Sm" "$LATEST")
    echo "   Файл: $(basename $LATEST)"
    echo "   Размер: $LATEST_SIZE"
    echo "   Дата: $LATEST_DATE"
fi

# Показываем общий размер всех бэкапов
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "💾 Общий размер всех бэкапов: $TOTAL_SIZE"

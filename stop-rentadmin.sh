#!/bin/bash

# Безопасная остановка ТОЛЬКО RentAdmin без влияния на другие проекты

echo "🛑 Остановка RentAdmin..."

# Получаем путь к проекту
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Остановка через PID файл
if [ -f "$PROJECT_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$PROJECT_DIR/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "   - Остановка backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
        sleep 2

        # Если не остановился - принудительно
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo "   - Принудительная остановка..."
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
    fi
    rm "$PROJECT_DIR/backend.pid"
fi

# 2. Остановка всех процессов из директории RentAdmin
echo "   - Поиск всех процессов RentAdmin..."
PIDS=$(ps aux | grep node | grep -E "(RentAdmin|rentadmin)" | grep -v grep | awk '{print $2}')

if [ ! -z "$PIDS" ]; then
    echo "   - Найдено процессов: $(echo $PIDS | wc -w)"
    for PID in $PIDS; do
        PROCESS_CWD=$(readlink -f /proc/$PID/cwd 2>/dev/null || echo "")
        if [[ "$PROCESS_CWD" == *"RentAdmin"* ]] || [[ "$PROCESS_CWD" == *"rentadmin"* ]]; then
            echo "   - Остановка процесса $PID ($PROCESS_CWD)"
            kill $PID 2>/dev/null || true
        fi
    done

    sleep 2

    # Принудительная остановка если не остановились
    for PID in $PIDS; do
        if ps -p $PID > /dev/null 2>&1; then
            PROCESS_CWD=$(readlink -f /proc/$PID/cwd 2>/dev/null || echo "")
            if [[ "$PROCESS_CWD" == *"RentAdmin"* ]] || [[ "$PROCESS_CWD" == *"rentadmin"* ]]; then
                kill -9 $PID 2>/dev/null || true
            fi
        fi
    done
fi

# 3. Проверка порта 3001
if command -v lsof &> /dev/null && lsof -i :3001 > /dev/null 2>&1; then
    PROCESS_ON_3001=$(lsof -ti :3001)
    PROCESS_PATH=$(readlink -f /proc/$PROCESS_ON_3001/cwd 2>/dev/null || echo "")

    if [[ "$PROCESS_PATH" == *"RentAdmin"* ]]; then
        echo "   - Освобождение порта 3001..."
        kill -9 $PROCESS_ON_3001 2>/dev/null || true
    else
        echo "   ℹ️  Порт 3001 используется другим проектом, не трогаем"
    fi
fi

# 4. Остановка Docker контейнера
if [ -f "$PROJECT_DIR/docker-compose.host.yml" ]; then
    echo "   - Остановка nginx контейнера..."
    cd "$PROJECT_DIR"
    docker-compose -f docker-compose.host.yml down 2>/dev/null || true
fi

echo ""
echo "✅ RentAdmin остановлен"
echo ""
echo "💡 Для запуска используйте:"
echo "   ./restart-vm.sh  - полная пересборка и запуск"

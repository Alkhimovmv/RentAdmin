# 🚀 Быстрый запуск API - Экстренная инструкция

## Проблема: API недоступно, таймауты на Netlify

### Решение 1: Node.js сервер (рекомендуется)

```bash
cd ~/RentAdmin
chmod +x start-simple-server.sh
./start-simple-server.sh
```

Сервер запустится на `https://87.242.103.146:3001/api`

### Решение 2: Python сервер (если Node.js недоступен)

```bash
cd ~/RentAdmin
chmod +x test-server.py
python3 test-server.py
```

Сервер запустится на `https://87.242.103.146:8080/api`

### Решение 3: Ручной Node.js запуск

```bash
cd ~/RentAdmin
npm install express cors
node simple-server.js
```

## Проверка работы

После запуска любого сервера проверьте:

```bash
# Локально
curl http://localhost:3001/api/health
curl http://localhost:8080/api/health

# Извне (с другого компьютера)
curl http://87.242.103.146:3001/api/health
curl http://87.242.103.146:8080/api/health
```

## Автоматическое переключение

Frontend автоматически найдет рабочий сервер из списка:

1. `https://87.242.103.146/api` (Docker)
2. `https://87.242.103.146:3001/api` (Node.js standalone)
3. `https://87.242.103.146:8080/api` (Python standalone)
4. `http://localhost:3001/api` (локальная разработка)

## Настройка Netlify

В Netlify установите переменную окружения:

```
VITE_API_URL=https://87.242.103.146:3001/api
```

Или для Python сервера:

```
VITE_API_URL=https://87.242.103.146:8080/api
```

## Остановка серверов

```bash
# Node.js сервер
pkill -f "node.*simple-server"

# Python сервер
pkill -f "python.*test-server"

# Или по PID
cat simple-server.pid
kill $(cat simple-server.pid)
```

## Логи

```bash
# Node.js сервер
tail -f simple-server.log

# Python сервер (выводится в терминал)
# Логи видны при запуске
```

---

⚠️ **Важно**: Эти серверы работают БЕЗ базы данных и используют mock данные для тестирования!
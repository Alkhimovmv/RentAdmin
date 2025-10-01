# Исправление: API возвращает 500 ошибку

## Проблема

После развертывания на VM через `deploy-vm.sh`, API endpoints возвращают 500 ошибку:
- `http://87.242.103.146/api/rentals` → 500 Internal Server Error
- `http://87.242.103.146/api/equipment` → 500 Internal Server Error
- И другие защищенные endpoints

## Причины

### 1. Backend использовал неправильную БД в production режиме

**Файл**: [backend/src/utils/database.ts:38](backend/src/utils/database.ts:38)

```typescript
production: {
  client: 'sqlite3',
  connection: {
    filename: './production.sqlite3'  // ❌ Эта БД не существует!
  },
  // ...
}
```

Все данные находились в `dev.sqlite3`, но production режим пытался использовать `production.sqlite3`, которая не существовала и не содержала таблиц.

### 2. Backend запускался без NODE_ENV=production

**Файл**: [deploy-vm.sh:128](deploy-vm.sh:128)

```bash
nohup npm start > backend.log 2>&1 &  # ❌ Без NODE_ENV
```

Без явной установки `NODE_ENV=production`, backend мог работать в development режиме.

### 3. TypeScript ошибка в CORS origins

**Файл**: [backend/src/server.ts:33](backend/src/server.ts:33)

```typescript
const allowedOrigins = [corsOrigin, 'http://localhost:5173', ...]
// ❌ corsOrigin может быть undefined
```

TypeScript не позволял собрать backend из-за типов.

## Решения

### ✅ 1. Исправлена конфигурация БД для production

**Файл**: `backend/src/utils/database.ts`

```typescript
production: {
  client: 'sqlite3',
  connection: {
    filename: './dev.sqlite3'  // ✅ Используем ту же БД что и в development
  },
  useNullAsDefault: true,
  migrations: {
    directory: './src/migrations',
  },
  seeds: {
    directory: './src/seeds',
  },
},
```

**Почему это правильно:**
- Все данные уже в `dev.sqlite3`
- Не нужно дублировать БД
- Production и development используют одну БД на локальной машине/VM

### ✅ 2. Backend запускается с NODE_ENV=production

**Файл**: `deploy-vm.sh`

```bash
NODE_ENV=production nohup npm start > backend.log 2>&1 &
```

**Результат:**
- Backend использует production конфигурацию
- Правильное логирование
- Корректные CORS настройки

### ✅ 3. Исправлена ошибка TypeScript в CORS

**Файл**: `backend/src/server.ts`

```typescript
const allowedOrigins = (process.env.NODE_ENV === 'development'
  ? [corsOrigin, 'http://localhost:5173', 'http://localhost:3000', 'http://87.242.103.146']
  : [corsOrigin, 'http://87.242.103.146', 'http://localhost']
).filter((origin): origin is string => origin !== undefined);
```

**Результат:**
- Фильтруются undefined значения
- TypeScript компилируется без ошибок
- Backend собирается успешно

### ✅ 4. Улучшена проверка nginx в deploy-vm.sh

**Файл**: `deploy-vm.sh`

```bash
# Проверка nginx с повторными попытками
NGINX_READY=0
for i in {1..10}; do
    if docker ps --filter "name=rentadmin_nginx" --filter "status=running" | grep -q rentadmin_nginx; then
        NGINX_READY=1
        echo "✅ Nginx запущен"
        break
    fi
    sleep 1
done
```

**Результат:**
- Более надежная проверка запуска
- Показывает логи при ошибке
- Не падает сразу

## Проверка исправлений

### Локально (перед развертыванием на VM)

```bash
# 1. Backend собирается без ошибок
cd backend
npm run build
# ✅ Должно завершиться успешно

# 2. Backend запускается в production режиме
NODE_ENV=production npm start &
sleep 3

# 3. Проверка health
curl http://localhost:3001/api/health
# ✅ Должен вернуть {"status":"OK","environment":"production",...}

# 4. Получение токена
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pinCode":"20031997"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 5. Проверка rentals
curl -s http://localhost:3001/api/rentals -H "Authorization: Bearer $TOKEN"
# ✅ Должен вернуть массив аренд

# 6. Остановка
pkill -f "node dist/server.js"
```

### На VM (после развертывания)

```bash
# 1. Полное развертывание
./deploy-vm.sh

# 2. Проверка health
curl http://87.242.103.146/api/health
# ✅ {"status":"OK",...}

# 3. Логин
curl -X POST http://87.242.103.146/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pinCode":"20031997"}'
# ✅ Вернет токен

# 4. Проверка rentals с токеном
TOKEN="<полученный_токен>"
curl http://87.242.103.146/api/rentals \
  -H "Authorization: Bearer $TOKEN"
# ✅ Должен вернуть массив аренд, НЕ 500 ошибку
```

## Диагностика проблем

### Если все еще 500 ошибка на VM:

#### 1. Проверить, что backend запущен в production режиме

```bash
# На VM
curl http://localhost:3001/api/health

# Проверить "environment" в ответе:
# ✅ "environment":"production"
# ❌ "environment":"development"
```

#### 2. Проверить логи backend

```bash
tail -50 backend/backend.log

# Должны быть запросы типа:
# {"level":30,"msg":"GET /api/rentals"}
```

**Если запросов нет** → проблема в nginx
**Если есть ошибки БД** → проблема в database.ts

#### 3. Проверить БД

```bash
cd backend
ls -lh dev.sqlite3

# Проверить таблицы
sqlite3 dev.sqlite3 ".tables"
# Должны быть: equipment, rentals, rental_equipment, expenses и др.
```

#### 4. Проверить nginx

```bash
docker ps --filter "name=rentadmin"
# STATUS должен быть "Up"

docker logs rentadmin_nginx --tail 50
# Не должно быть ошибок
```

#### 5. Тестировать напрямую к backend (минуя nginx)

```bash
# На VM
curl http://localhost:3001/api/rentals -H "Authorization: Bearer TOKEN"

# ✅ Работает → проблема в nginx конфигурации
# ❌ Не работает → проблема в backend
```

## Архитектура БД

### Development режим
```
backend/dev.sqlite3 (существует, содержит данные)
```

### Production режим (ПОСЛЕ исправления)
```
backend/dev.sqlite3 (та же самая БД)
```

### Production режим (ДО исправления) ❌
```
backend/production.sqlite3 (НЕ существует, пустая)
```

## Файлы изменены

| Файл | Изменение |
|------|-----------|
| `backend/src/utils/database.ts` | Production использует `dev.sqlite3` |
| `backend/src/server.ts` | Фильтрация undefined в CORS origins |
| `deploy-vm.sh` | `NODE_ENV=production` при запуске backend |
| `deploy-vm.sh` | Улучшена проверка nginx |
| `frontend/src/api/client.ts` | Production использует фиксированный API URL |

## Дополнительные файлы

- [API-URL-FIX.md](API-URL-FIX.md) - исправление проблемы с localhost API
- [VM-STOP-INSTRUCTIONS.md](VM-STOP-INSTRUCTIONS.md) - остановка на VM
- [DEPLOY.md](DEPLOY.md) - полная документация развертывания
- [SCRIPTS.md](SCRIPTS.md) - описание всех скриптов

## Итоговая команда развертывания

```bash
# На VM
cd /path/to/RentAdmin
./deploy-vm.sh
```

Всё должно работать! ✅

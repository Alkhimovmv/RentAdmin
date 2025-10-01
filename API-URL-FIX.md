# Исправление: Frontend обращается к localhost вместо VM

## Проблема

После запуска `deploy-vm.sh` на виртуальной машине, фронтенд обращается к `http://localhost:3001/api` вместо `http://87.242.103.146/api`.

## Причина

В файле [frontend/src/api/client.ts](frontend/src/api/client.ts) была логика автоматического поиска доступных API серверов при инициализации клиента. Эта логика проверяла:

1. `http://localhost:3001/api` (первым)
2. `http://87.242.103.146/api` (вторым)

И выбирала первый доступный сервер. Если локальный backend был запущен, фронтенд подключался к нему даже в production режиме.

## Решение

### Изменения в `frontend/src/api/client.ts`:

#### 1. Фиксированный API URL для production

```typescript
// В production всегда используем VITE_API_URL, без fallback проверок
let currentApiUrl: string = import.meta.env.MODE === 'production'
  ? (import.meta.env.VITE_API_URL || 'http://87.242.103.146/api')
  : API_SERVERS[0];
```

#### 2. Отключена автоматическая проверка серверов в production

```typescript
async function initializeApiClient(): Promise<AxiosInstance> {
  // В production не проверяем серверы, используем заданный URL напрямую
  if (import.meta.env.MODE === 'production') {
    currentApiUrl = import.meta.env.VITE_API_URL || 'http://87.242.103.146/api';
    console.log(`🔧 Production mode: using fixed API URL: ${currentApiUrl}`);
  } else {
    currentApiUrl = await findWorkingServer();
  }
  const client = createApiClient(currentApiUrl);
  // ...
}
```

#### 3. Отключено автоматическое переключение серверов в production

```typescript
// Если сервер недоступен - попробуем переключиться (только в dev режиме)
if (import.meta.env.MODE !== 'production' && !error.response && ...) {
  // логика переключения серверов
}
```

## Как применить исправление

### Вариант 1: Быстрое обновление (только frontend)

```bash
cd /home/maxim/RentAdmin
./quick-frontend-update.sh
```

Этот скрипт:
- Пересобирает frontend с production настройками
- Перезапускает nginx
- Проверяет доступность

### Вариант 2: Полное развертывание

```bash
cd /home/maxim/RentAdmin
./deploy-vm.sh
```

Пересобирает и backend, и frontend.

## Проверка

### 1. Проверить API URL в собранном файле

```bash
grep -o "http://[^\"']*" frontend/dist/assets/index-*.js | grep api
```

Должно вывести: `http://87.242.103.146/api`

### 2. Проверить в браузере

1. Откройте http://87.242.103.146
2. Откройте DevTools (F12)
3. Перейдите на вкладку Console
4. Должно быть сообщение: `🔧 Production mode: using fixed API URL: http://87.242.103.146/api`

### 3. Проверить Network запросы

1. Откройте DevTools → Network
2. Обновите страницу (Ctrl+F5)
3. Все запросы к `/api/*` должны идти на `http://87.242.103.146/api/...`

## Важно

- **Development режим** (`npm run dev`): используется автоматический поиск серверов (localhost → VM)
- **Production режим** (`npm run build`): используется фиксированный URL из `.env.production`

## Конфигурация

### `.env.production`

```env
VITE_API_URL=http://87.242.103.146/api
```

Этот файл определяет API URL для production сборки.

### `.env.development` (для локальной разработки)

```env
VITE_API_URL=http://localhost:3001/api
```

## Режимы работы

| Режим | Команда | API URL | Автопоиск |
|-------|---------|---------|-----------|
| Development | `npm run dev` | localhost:3001 → VM | ✅ Да |
| Production | `npm run build` | Из VITE_API_URL | ❌ Нет |

## Troubleshooting

### Frontend все еще обращается к localhost

1. **Очистите кеш браузера**: Ctrl+F5 или Ctrl+Shift+Delete
2. **Пересоберите frontend**: `./quick-frontend-update.sh`
3. **Проверьте режим сборки**: должен быть `production`, не `development`

### Как проверить режим сборки

```bash
cat frontend/dist/assets/index-*.js | grep "Production mode"
```

Если найдено, значит собрано правильно.

### Backend недоступен на VM

```bash
# Проверить backend
curl http://87.242.103.146/api/health

# Проверить процесс
lsof -i :3001

# Перезапустить
./deploy-vm.sh
```

## Скрипты

| Скрипт | Описание |
|--------|----------|
| `./deploy-vm.sh` | Полное развертывание (backend + frontend) |
| `./quick-frontend-update.sh` | Быстрое обновление frontend |
| `./stop-vm.sh` | Остановка всех сервисов |

## См. также

- [DEPLOY.md](DEPLOY.md) - Полная документация по развертыванию
- [SCRIPTS.md](SCRIPTS.md) - Описание всех скриптов
- [VM-STOP-INSTRUCTIONS.md](VM-STOP-INSTRUCTIONS.md) - Инструкции по остановке

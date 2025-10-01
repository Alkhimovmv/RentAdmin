# Инструкция по остановке RentAdmin на VM

## Проблема

После `reboot` виртуальной машины фронтенд остается активным из-за того, что Docker контейнеры настроены на автозапуск.

## Решение

### Вариант 1: Полная остановка с отключением автозапуска (рекомендуется)

Запустите на виртуальной машине:

```bash
cd /path/to/RentAdmin
./vm-stop-complete.sh
```

Этот скрипт:
- ✅ Останавливает все Docker контейнеры
- ✅ Отключает автозапуск контейнеров
- ✅ Останавливает backend процесс
- ✅ Освобождает порты 80 и 3001
- ✅ Предлагает удалить контейнеры (опционально)

После выполнения этого скрипта контейнеры НЕ будут запускаться после перезагрузки VM.

---

### Вариант 2: Ручная остановка

#### Шаг 1: Остановить контейнеры

```bash
docker-compose -f docker-compose.host.yml down
```

#### Шаг 2: Отключить автозапуск

```bash
# Найти контейнеры
docker ps -a --filter "name=rentadmin"

# Отключить автозапуск для всех контейнеров rentadmin
docker ps -a -q --filter "name=rentadmin" | xargs docker update --restart=no
```

#### Шаг 3: Удалить контейнеры (опционально)

```bash
docker ps -a -q --filter "name=rentadmin" | xargs docker rm -f
```

#### Шаг 4: Остановить backend

```bash
# Если есть PID файл
if [ -f backend.pid ]; then
    kill $(cat backend.pid)
    rm backend.pid
fi

# Или найти процесс
pkill -f "node.*dist/server.js"
```

#### Шаг 5: Освободить порты

```bash
# Порт 80 (nginx)
lsof -ti :80 | xargs kill -9

# Порт 3001 (backend)
lsof -ti :3001 | xargs kill -9
```

---

### Вариант 3: Проверить и остановить автозапуск существующих контейнеров

Если контейнеры уже созданы и настроены на автозапуск:

```bash
# Проверить restart policy
docker inspect $(docker ps -a -q --filter "name=rentadmin") --format '{{.Name}}: {{.HostConfig.RestartPolicy.Name}}'

# Если видите "always" или "unless-stopped", отключите:
docker ps -a -q --filter "name=rentadmin" | xargs docker update --restart=no

# Остановите контейнеры
docker ps -q --filter "name=rentadmin" | xargs docker stop
```

---

## Проверка статуса

### Проверить Docker контейнеры

```bash
docker ps -a --filter "name=rentadmin"
```

Ожидаемый результат: контейнеры в статусе `Exited` или вообще отсутствуют.

### Проверить restart policy

```bash
docker inspect $(docker ps -a -q --filter "name=rentadmin") --format '{{.Name}}: {{.HostConfig.RestartPolicy.Name}}'
```

Ожидаемый результат: `no` (не `always` и не `unless-stopped`)

### Проверить порты

```bash
lsof -i :80
lsof -i :3001
```

Ожидаемый результат: порты свободны (нет вывода)

### Проверить backend процесс

```bash
ps aux | grep "node.*dist/server.js" | grep -v grep
```

Ожидаемый результат: процессы не найдены (нет вывода)

### Проверить доступность приложения

```bash
curl http://87.242.103.146/
```

Ожидаемый результат: `Connection refused` или timeout

---

## Причина проблемы

При создании Docker контейнеров через `docker-compose up -d`, по умолчанию может быть установлена политика перезапуска `unless-stopped` или `always`, что заставляет Docker автоматически запускать контейнеры при старте системы.

### Проверить docker-compose.host.yml

Откройте файл `docker-compose.host.yml` и проверьте наличие `restart`:

```yaml
services:
  nginx:
    image: nginx:alpine
    container_name: rentadmin_nginx
    restart: always  # <-- ЭТО ПРИЧИНА
    # ...
```

Если там `restart: always` или `restart: unless-stopped`, замените на:

```yaml
    restart: "no"  # или вообще уберите эту строку
```

Затем пересоздайте контейнеры:

```bash
docker-compose -f docker-compose.host.yml down
docker-compose -f docker-compose.host.yml up -d
```

---

## Рекомендации

1. **Для разработки**: Используйте `restart: "no"` или вообще не указывайте restart policy
2. **Для production**: Если нужен автозапуск, используйте `restart: unless-stopped` и останавливайте через `docker-compose down`
3. **После остановки**: Всегда проверяйте статус через `docker ps -a`
4. **Перед перезагрузкой VM**: Убедитесь, что автозапуск отключен

---

## Быстрая справка команд

| Команда | Описание |
|---------|----------|
| `./vm-stop-complete.sh` | Полная остановка + отключение автозапуска |
| `docker-compose down` | Остановить и удалить контейнеры |
| `docker update --restart=no <id>` | Отключить автозапуск контейнера |
| `docker ps -a` | Список всех контейнеров |
| `docker logs <container>` | Просмотр логов контейнера |
| `lsof -i :80` | Проверить порт 80 |
| `lsof -i :3001` | Проверить порт 3001 |

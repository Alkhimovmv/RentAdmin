# Конфигурация портов на сервере

## Проблема
На сервере работают несколько проектов одновременно. Порт 80 уже занят проектом VozmiMenja.

## Решение
RentAdmin использует **порт 8080** для избежания конфликтов.

## Порты на сервере

| Проект | Порт | Назначение | URL |
|--------|------|------------|-----|
| **VozmiMenja** | 80 | Frontend + API | http://87.242.103.146 |
| **VozmiMenja Backend** | 3002 | Node.js API | http://localhost:3002 |
| **RentAdmin** | 8080 | Frontend + API | http://87.242.103.146:8080 |
| **RentAdmin Backend** | 3001 | Node.js API | http://localhost:3001 |

## Доступ к приложениям

### RentAdmin
- 🌐 **Браузер**: http://87.242.103.146:8080
- 📡 **API**: http://87.242.103.146:8080/api
- ✅ **Health Check**: http://87.242.103.146:8080/health

### VozmiMenja
- 🌐 **Браузер**: http://87.242.103.146
- 📡 **API**: http://87.242.103.146/api

## Если нужно изменить порт

Отредактируйте файл `nginx-host.conf`:

```nginx
server {
    listen 8080;  # Измените на нужный порт
    server_name 87.242.103.146;
    # ...
}
```

После изменения перезапустите:

```bash
./restart-vm.sh
```

## Использование доменов (опционально)

Если у вас есть отдельные домены:

### Вариант 1: Поддомены
- `rentadmin.yourdomain.ru` → RentAdmin (порт 80)
- `vozmimenya.yourdomain.ru` → VozmiMenja (порт 80)

### Вариант 2: Разные домены
- `rentadmin.ru` → RentAdmin (порт 80)
- `vozmimenya.ru` → VozmiMenja (порт 80)

В этом случае оба проекта смогут использовать порт 80 через nginx virtual hosts.

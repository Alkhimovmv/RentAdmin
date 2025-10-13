# Конфигурация портов и маршрутизации на сервере

## Архитектура

На сервере работают несколько проектов одновременно через **системный nginx на порту 80** с маршрутизацией по путям.

## Решение

RentAdmin использует **порт 80** с путем `/admin/` для доступа к интерфейсу.
Backend работает на **localhost:3001** (недоступен извне).

## Порты на сервере

| Проект | Порт | Назначение | URL |
|--------|------|------------|-----|
| **Nginx** | 80 | Общий веб-сервер | http://87.242.103.146 |
| **VozmiMenja API** | 3003 | API сервер | https://api.vozmimenya.ru |
| **RentAdmin Backend** | 3001 | Node.js API (localhost) | http://localhost:3001 |

## Маршрутизация на порту 80

| Путь | Проект | Назначение |
|------|--------|------------|
| `/` | Главная | Страница-заглушка с ссылками |
| `/admin/` | RentAdmin | Frontend приложение |
| `/api/` | RentAdmin | API (прокси на localhost:3001) |

## Доступ к приложениям

### RentAdmin
- 🌐 **Браузер**: http://87.242.103.146/admin/
- 📡 **API**: http://87.242.103.146/api/
- ✅ **Health Check**: http://87.242.103.146/health

### VozmiMenja
- 📡 **API**: https://api.vozmimenya.ru/

## Конфигурация Nginx

Конфигурация находится в файле `nginx-system.conf`.

После изменения примените конфигурацию:

```bash
sudo cp nginx-system.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl restart nginx
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

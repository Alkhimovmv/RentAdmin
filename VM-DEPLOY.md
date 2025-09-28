# Развёртывание RentAdmin на виртуальной машине

## Быстрый запуск

### Команды управления

```bash
# Запуск приложения
./start-vm.sh

# Остановка приложения
./stop-vm.sh

# Диагностика проблем
./debug-vm.sh
```

## Архитектура

**Гибридное решение для виртуальной машины:**
- **Backend**: запускается локально через Node.js на порту 3001
- **Nginx**: работает в Docker контейнере с `network_mode: host`
- **Frontend**: статические файлы раздаются через nginx

## Что было исправлено

### Проблемы с Docker
- ❌ Alpine Linux репозитории недоступны
- ❌ Пакеты `dumb-init` и `sqlite` не найдены
- ❌ Проблемы с Dockerfile сборкой

### Решение
- ✅ Backend запускается локально
- ✅ Nginx в контейнере с host network
- ✅ Упрощённая архитектура без проблемных зависимостей

## Файлы конфигурации

### Docker Compose
- `docker-compose.host.yml` - конфигурация для виртуальной машины
- `nginx-host.conf` - nginx конфигурация для localhost backend

### Скрипты
- `start-vm.sh` - запуск приложения
- `stop-vm.sh` - остановка приложения
- `debug-vm.sh` - диагностика проблем

## Проверка работоспособности

### Автоматическая проверка
Скрипт `start-vm.sh` автоматически проверяет:
- ✅ Запуск backend процесса
- ✅ Доступность API (health check)
- ✅ Работу nginx контейнера
- ✅ Доступность frontend

### Ручная проверка
```bash
# API
curl http://localhost/api/health

# Frontend
curl http://localhost/

# Nginx health
curl http://localhost/health

# Backend напрямую
curl http://localhost:3001/api/health
```

## Устранение неполадок

### Backend не запускается

1. **Проверить логи:**
```bash
cat backend/backend.log
```

2. **Проверить занятость порта:**
```bash
lsof -i :3001
```

3. **Запустить вручную для отладки:**
```bash
cd backend && npm start
```

### Nginx не работает

1. **Проверить контейнер:**
```bash
docker ps | grep rentadmin_nginx
```

2. **Проверить логи nginx:**
```bash
docker logs rentadmin_nginx
```

3. **Проверить конфигурацию:**
```bash
docker exec rentadmin_nginx nginx -t
```

### Использование диагностического скрипта

```bash
./debug-vm.sh
```

Показывает полную информацию о состоянии системы:
- Статус Docker контейнеров
- Запущенные процессы
- Занятые порты
- Health checks
- Логи
- Версии зависимостей

## Особенности виртуальной машины

### Network Mode: Host
Nginx использует `network_mode: host` для доступа к локальному backend на 127.0.0.1:3001

### Логирование
- Backend логи: `backend/backend.log`
- Nginx логи: `docker logs rentadmin_nginx`

### PID Management
- Backend PID сохраняется в `backend.pid`
- Автоматическая очистка старых процессов при запуске

## Адреса доступа

- **Внешний доступ**: `http://87.242.103.146`
- **Локальный доступ**: `http://localhost`
- **API endpoint**: `http://localhost/api/health`
- **Backend напрямую**: `http://localhost:3001/api/health`

## Требования

- Node.js 18+
- NPM
- Docker
- Linux с поддержкой `lsof`

## Примечания

- Приложение автоматически адаптируется под виртуальную машину
- Все зависимости устанавливаются автоматически
- Поддерживается автоматический restart при сбоях
- Логи доступны для отладки
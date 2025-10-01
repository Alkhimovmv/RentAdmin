# Руководство по развертыванию RentAdmin на VM

## Архитектура развертывания

Проект разворачивается на виртуальной машине **87.242.103.146** со следующей архитектурой:

- **Frontend**: React приложение, раздается через Nginx
- **Backend**: Node.js Express сервер на порту 3001
- **Nginx**: Прокси-сервер для роутинга запросов (Docker контейнер)
- **База данных**: SQLite (dev.sqlite3)

## Скрипты развертывания

### Полное развертывание (с пересборкой)

```bash
./deploy-vm.sh
```

Этот скрипт выполняет:
1. Остановку всех процессов (nginx, backend)
2. Полную пересборку backend (удаление dist/, npm run build)
3. Полную пересборку frontend (удаление dist/, npm run build)
4. Запуск backend сервера
5. Запуск nginx через Docker
6. Проверку работоспособности всех компонентов

**Важно:** База данных НЕ очищается при развертывании!

### Остановка системы

```bash
./stop-vm.sh
```

Останавливает:
- Nginx Docker контейнер
- Backend процесс Node.js

### Обновление только фронтенда

```bash
./update-frontend.sh
```

Выполняет:
1. Пересборку фронтенда
2. Перезапуск nginx (если необходимо)

**Примечание:** Не требует остановки backend

## Конфигурационные файлы

### Frontend (.env.production)

```env
VITE_API_URL=http://87.242.103.146/api
```

Frontend настроен на обращение к API через nginx на VM.

### Backend (.env.production)

```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://87.242.103.146,http://localhost
API_URL=http://87.242.103.146/api
```

Backend работает на порту 3001 и обрабатывает CORS для VM.

### Nginx (nginx-host.conf)

```nginx
upstream backend {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name 87.242.103.146;

    location /api/ {
        proxy_pass http://backend;
        # ... настройки прокси
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

## Доступ к приложению

После развертывания приложение доступно по адресам:

- **Внешний адрес**: http://87.242.103.146
- **Локальный адрес**: http://localhost (на самой VM)

## Проверка работоспособности

### Health Check Endpoints

```bash
# API Health
curl http://87.242.103.146/api/health

# Nginx Health
curl http://87.242.103.146/health

# Frontend
curl http://87.242.103.146/
```

### Логи

```bash
# Backend логи
tail -f backend/backend.log

# Nginx логи
docker logs rentadmin_nginx

# Статус Docker контейнера
docker ps --filter "name=rentadmin"
```

### Проверка процессов

```bash
# Backend процесс
lsof -i :3001

# PID файл
cat backend.pid

# Docker контейнер
docker ps | grep rentadmin
```

## Troubleshooting

### Backend не запускается

1. Проверьте логи: `tail -f backend/backend.log`
2. Проверьте занятость порта: `lsof -i :3001`
3. Освободите порт: `lsof -ti :3001 | xargs kill -9`
4. Перезапустите: `./deploy-vm.sh`

### Frontend показывает старую версию

1. Очистите кеш браузера (Ctrl+F5)
2. Пересоберите фронтенд: `./update-frontend.sh`
3. Проверьте, что nginx перезапущен: `docker restart rentadmin_nginx`

### CORS ошибки

1. Проверьте CORS настройки в backend/.env.production
2. Убедитесь, что IP VM (87.242.103.146) в списке разрешенных origins
3. Проверьте, что nginx НЕ добавляет дублирующие CORS заголовки

### База данных не найдена

База данных создается автоматически при первом запуске backend.
Файл находится в `backend/dev.sqlite3`.

Для проверки таблиц:
```bash
sqlite3 backend/dev.sqlite3 ".tables"
```

## Архитектура множественного выбора оборудования

Проект поддерживает множественный выбор оборудования для аренды:

- Таблица `rental_equipment` содержит связи между арендой и оборудованием
- Виртуальные ID оборудования: `4001` = оборудование 4, экземпляр 1
- Frontend использует чекбоксы для выбора нескольких единиц
- Gantt диаграмма показывает отдельную строку для каждой единицы оборудования

## Безопасность

- JWT токены для аутентификации
- CORS настроен только для разрешенных origin
- Security headers настроены в nginx
- Rate limiting для API запросов (10 req/s)

## Производительность

- Gzip сжатие включено
- Static assets кешируются на 1 год
- Минификация и tree-shaking для production сборки
- Code splitting для оптимизации загрузки

# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ СЕРВЕРА Cloud.ru

## ❗ Проблемы обнаружены:
1. **Backend недоступен** на порту 3001 (Connection refused)
2. **Nginx принудительно редиректит** HTTP → HTTPS (301)
3. **HTTPS не работает** (SSL проблемы)

---

## 🔥 НЕМЕДЛЕННЫЕ ДЕЙСТВИЯ НА СЕРВЕРЕ:

### Шаг 1: Подключиться к серверу
```bash
ssh user@87.242.103.146
cd ~/RentAdmin  # или где у вас проект
```

### Шаг 2: Проверить статус контейнеров
```bash
docker ps
docker-compose -f docker-compose.cloud.yml ps

# Должно показать ВСЕ контейнеры как "Up":
# - rent-admin-backend-cloud
# - rent-admin-db-cloud
# - rent-admin-nginx
```

### Шаг 3: Если backend не запущен
```bash
# Перезапустить все сервисы
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d

# Проверить логи backend
docker-compose -f docker-compose.cloud.yml logs backend --tail=20

# Проверить логи БД
docker-compose -f docker-compose.cloud.yml logs database --tail=20
```

### Шаг 4: Исправить nginx (убрать HTTPS редирект)
```bash
# Скачать исправленную конфигурацию nginx
git pull origin main

# Заменить nginx конфигурацию на HTTP-only
cp nginx-fix.conf nginx/nginx.conf

# Перезапустить nginx
docker-compose -f docker-compose.cloud.yml restart nginx

# Проверить логи nginx
docker-compose -f docker-compose.cloud.yml logs nginx --tail=10
```

### Шаг 5: Открыть порты в firewall
```bash
# Открыть нужные порты
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp

# Проверить статус
sudo ufw status
```

### Шаг 6: ТЕСТ API
```bash
# Тестировать API через nginx (должен работать!)
curl -v http://87.242.103.146/api/health

# Если не работает, тестировать напрямую backend:
curl -v http://localhost:3001/api/health
```

---

## 🎯 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:

### ✅ Должно работать:
```bash
curl http://87.242.103.146/api/health
# Ответ: {"status":"ok","timestamp":"..."}

curl http://87.242.103.146/
# Ответ: "RentAdmin API Server - HTTP Mode (Port 80)"
```

### ❌ НЕ должно быть:
- Connection refused на порту 3001
- 301 редирект на HTTPS
- SSL handshake ошибки

---

## 🔧 АЛЬТЕРНАТИВНЫЕ РЕШЕНИЯ:

### Если nginx не работает - прямой доступ к backend:
```bash
# В docker-compose.cloud.yml добавить в backend:
ports:
  - "3001:3001"

# Перезапустить
docker-compose -f docker-compose.cloud.yml restart backend

# Открыть порт
sudo ufw allow 3001/tcp
```

### Если база данных не работает:
```bash
# Проверить переменные окружения
cat .env

# Перезагрузить БД
docker-compose -f docker-compose.cloud.yml restart database

# Запустить миграции
docker-compose -f docker-compose.cloud.yml exec backend npm run db:migrate
```

---

## 📱 ОБНОВИТЬ NETLIFY:

После исправления сервера:

1. **Зайти в Netlify Dashboard**
2. **Site settings → Environment variables**
3. **Обновить VITE_API_URL:**
   ```
   http://87.242.103.146/api
   ```
4. **Нажать "Deploy site"**

---

## 🚨 КРИТИЧЕСКИЕ КОМАНДЫ:

```bash
# Полная перезагрузка системы (если ничего не помогает)
docker-compose -f docker-compose.cloud.yml down
docker system prune -f
docker-compose -f docker-compose.cloud.yml up -d --build

# Проверить что все порты слушаются
sudo netstat -tlnp | grep -E "(80|3001|5432)"

# Проверить логи системы
sudo journalctl -u docker --tail=20
```

---

## ✅ КОНТРОЛЬНЫЙ СПИСОК:

- [ ] Backend контейнер запущен
- [ ] База данных доступна
- [ ] Nginx запущен без HTTPS редиректа
- [ ] Порты 80 и 3001 открыты в firewall
- [ ] API отвечает: `curl http://87.242.103.146/api/health`
- [ ] Netlify обновлен с правильным API URL

**После выполнения всех шагов API должен работать!** 🎯
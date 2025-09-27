# 🚀 Команды для выполнения на сервере cloud.ru

## 📋 Прямое развертывание фронтенда на сервере

### Подключение к серверу:
```bash
ssh user1@87.242.103.146
```

### Команды на сервере:

#### 1. Сборка и развертывание фронтенда:
```bash
cd /home/user1/RentAdmin/frontend

# Создание правильного .env.production
echo "VITE_API_URL=http://87.242.103.146/api" > .env.production
echo "NODE_ENV=production" >> .env.production

# Сборка фронтенда
npm run build

# Развертывание
sudo rm -rf /var/www/html/rentadmin/*
sudo cp -r dist/* /var/www/html/rentadmin/
sudo chown -R www-data:www-data /var/www/html/rentadmin
sudo chmod -R 755 /var/www/html/rentadmin
sudo find /var/www/html/rentadmin -type f -exec chmod 644 {} \;

# Перезапуск nginx
sudo systemctl restart nginx
```

#### 2. Проверка результата:
```bash
# Проверка статуса
sudo systemctl status nginx
curl http://localhost/

# Проверка файлов
ls -la /var/www/html/rentadmin/
```

#### 3. Если нужно исправить права (403 Forbidden):
```bash
sudo chown -R www-data:www-data /var/www/html/rentadmin
sudo chmod -R 755 /var/www/html/rentadmin
sudo find /var/www/html/rentadmin -type f -exec chmod 644 {} \;
sudo systemctl restart nginx
```

## 🎯 Ожидаемый результат:
После выполнения команд ваше React приложение будет доступно по адресу:
**http://87.242.103.146/**

## 🔧 Диагностика проблем:

### Если фронтенд не загружается:
```bash
# Проверить nginx
sudo nginx -t
sudo systemctl status nginx

# Проверить файлы
ls -la /var/www/html/rentadmin/
cat /var/log/nginx/error.log | tail -10
```

### Если API не работает:
```bash
# Проверить бэкенд
sudo systemctl status rentadmin
curl http://localhost:3001/api/health

# Проверить логи
sudo journalctl -u rentadmin -n 20
```
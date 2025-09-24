# 🚨 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ - Сервер недоступен

## ❗ ТЕКУЩАЯ СИТУАЦИЯ:
- Порт 80: Connection refused
- Порт 3001: Connection refused
- Nginx не запущен
- Backend недоступен

---

## 🔥 ПОШАГОВАЯ ДИАГНОСТИКА:

### Шаг 1: Базовая проверка системы
```bash
# На сервере 87.242.103.146
whoami
pwd
ls -la

# Проверить статус системы
df -h  # место на диске
free -h  # память
top  # процессы
```

### Шаг 2: Проверить Docker
```bash
docker --version
sudo systemctl status docker

# Если Docker не запущен:
sudo systemctl start docker
sudo systemctl enable docker
```

### Шаг 3: Найти проект
```bash
find /home -name "docker-compose.cloud.yml" -type f 2>/dev/null
cd ~/RentAdmin
# ИЛИ
cd /home/*/RentAdmin
```

### Шаг 4: Состояние контейнеров
```bash
docker ps -a
docker-compose -f docker-compose.cloud.yml ps

# Если контейнеры "Exited" или не найдены:
docker-compose -f docker-compose.cloud.yml up -d
```

### Шаг 5: Логи для диагностики
```bash
# Проверить логи каждого сервиса
docker-compose -f docker-compose.cloud.yml logs nginx
docker-compose -f docker-compose.cloud.yml logs backend
docker-compose -f docker-compose.cloud.yml logs database

# Проверить системные логи
sudo journalctl -u docker --tail=50
dmesg | tail
```

---

## 🚀 РЕШЕНИЯ ПО ПРИОРИТЕТУ:

### РЕШЕНИЕ 1: Перезапуск Docker сервисов
```bash
cd ~/RentAdmin
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml pull
docker-compose -f docker-compose.cloud.yml up -d --build

# Ждать 60 секунд
sleep 60

# Тестировать
curl http://localhost/api/health
curl http://localhost:3001/api/health
```

### РЕШЕНИЕ 2: Запуск только backend (без nginx)
```bash
# Изменить docker-compose.cloud.yml - добавить в backend:
ports:
  - "3001:3001"

# Перезапустить только backend
docker-compose -f docker-compose.cloud.yml up -d backend

# Открыть порт
sudo ufw allow 3001/tcp

# Тестировать
curl http://localhost:3001/api/health
```

### РЕШЕНИЕ 3: Запуск без Docker (нативно)
```bash
cd ~/RentAdmin/backend

# Установить Node.js если нет
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установить зависимости
npm install

# Создать .env для локального запуска
cat > .env << EOF
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rent_admin
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=local-secret-key
PIN_CODE=20031997
CORS_ORIGIN=https://vozmimenjaadmin.netlify.app
EOF

# Запустить PostgreSQL отдельно
docker run -d --name postgres-local \
  -e POSTGRES_DB=rent_admin \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 postgres:15-alpine

# Запустить backend
npm run build
npm start
```

---

## 🔍 ДИАГНОСТИЧЕСКИЕ КОМАНДЫ:

### Проверить сеть:
```bash
# Проверить сетевые интерфейсы
ip addr show
netstat -tlnp
ss -tlnp

# Проверить что Docker bridge работает
docker network ls
```

### Проверить ресурсы:
```bash
# Место на диске
df -h
du -sh /var/lib/docker/

# Память
free -h
cat /proc/meminfo

# Процессы
ps aux | grep docker
ps aux | grep nginx
ps aux | grep node
```

### Проверить файлы проекта:
```bash
ls -la ~/RentAdmin/
cat ~/RentAdmin/.env
cat ~/RentAdmin/docker-compose.cloud.yml
```

---

## 🚨 ЕСЛИ НИЧЕГО НЕ ПОМОГАЕТ:

### Полная переустановка Docker:
```bash
# Удалить старый Docker
sudo apt remove docker docker-engine docker.io containerd runc
sudo apt autoremove

# Установить заново
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Перезагрузить сервер
sudo reboot
```

### Временное решение - nginx как системный сервис:
```bash
# Установить nginx системно
sudo apt update
sudo apt install nginx

# Создать конфигурацию
sudo tee /etc/nginx/sites-available/rentadmin << EOF
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        add_header Access-Control-Allow-Origin "https://vozmimenjaadmin.netlify.app" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
    }
}
EOF

# Активировать
sudo ln -s /etc/nginx/sites-available/rentadmin /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## ✅ ПРОВЕРОЧНЫЕ КОМАНДЫ:

После любого решения проверить:
```bash
# Локально на сервере
curl http://localhost/api/health
curl http://localhost:3001/api/health

# Извне (с другого компьютера)
curl https://87.242.103.146/api/health
curl https://87.242.103.146:3001/api/health
```

**Одно из решений ДОЛЖНО сработать!** 🎯
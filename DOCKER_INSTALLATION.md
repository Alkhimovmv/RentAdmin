# Установка Docker и Docker Compose

## 🚀 Способ 1: Автоматическая установка с sudo (рекомендуется)

Для полной установки Docker с системными правами выполните:

```bash
sudo ./install-docker.sh
```

После установки:
1. Перелогиньтесь или выполните: `newgrp docker`
2. Запустите приложение: `docker-compose up -d`

## 🔧 Способ 2: Установка в пользовательском режиме (без sudo)

```bash
./install-docker-usermode.sh
```

**Ограничения rootless режима:**
- Некоторые функции могут быть недоступны
- Требуется больше ресурсов
- Могут быть проблемы с сетью

## 📋 Способ 3: Ручная установка

### 3.1 Установка Docker через snap (требует sudo)
```bash
sudo snap install docker
```

### 3.2 Установка через официальный convenience script
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 3.3 Установка Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🎯 После установки

### Проверка установки:
```bash
docker --version
docker-compose --version
```

### Тестовый запуск:
```bash
docker run --rm hello-world
```

### Запуск RentAdmin:
```bash
# Остановить текущие процессы
pkill -f node
pkill -f vite

# Запустить через Docker
docker-compose up -d

# Проверить логи
docker-compose logs -f
```

## 🔍 Доступ к приложению после Docker установки:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **База данных**: localhost:5432

**Пин-код**: `20031997`

## ❗ Устранение проблем

### Ошибка прав доступа:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Конфликт портов:
```bash
# Остановить текущие процессы
pkill -f "node.*demo-server"
pkill -f "vite"
```

### Проверка запущенных контейнеров:
```bash
docker ps
docker-compose ps
```
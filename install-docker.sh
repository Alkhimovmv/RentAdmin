#!/bin/bash

echo "🚀 Установка Docker и Docker Compose на Ubuntu 22.04"
echo "=================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка прав sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Этот скрипт должен быть запущен с правами sudo${NC}"
    echo "Запустите: sudo ./install-docker.sh"
    exit 1
fi

echo -e "${YELLOW}1. Обновление списка пакетов...${NC}"
apt update

echo -e "${YELLOW}2. Установка необходимых зависимостей...${NC}"
apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    uidmap

echo -e "${YELLOW}3. Добавление официального GPG ключа Docker...${NC}"
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo -e "${YELLOW}4. Добавление репозитория Docker...${NC}"
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

echo -e "${YELLOW}5. Обновление списка пакетов с новым репозиторием...${NC}"
apt update

echo -e "${YELLOW}6. Установка Docker CE...${NC}"
apt install -y docker-ce docker-ce-cli containerd.io

echo -e "${YELLOW}7. Запуск и включение автозапуска Docker...${NC}"
systemctl start docker
systemctl enable docker

echo -e "${YELLOW}8. Добавление пользователя в группу docker...${NC}"
# Получаем имя пользователя, который запустил sudo
REAL_USER=$(who am i | awk '{print $1}')
if [ -z "$REAL_USER" ]; then
    REAL_USER="maxim"
fi

usermod -aG docker $REAL_USER

echo -e "${YELLOW}9. Установка Docker Compose...${NC}"
# Получаем последнюю версию Docker Compose
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Создаем символическую ссылку для совместимости
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

echo -e "${YELLOW}10. Проверка установки...${NC}"
docker --version
docker-compose --version

echo -e "${GREEN}✅ Docker и Docker Compose успешно установлены!${NC}"
echo
echo -e "${YELLOW}Важно:${NC}"
echo "1. Перелогиньтесь или выполните команду: newgrp docker"
echo "2. После этого можете запустить: docker-compose up -d"
echo
echo -e "${GREEN}Тестовая команда:${NC}"
echo "docker run --rm hello-world"
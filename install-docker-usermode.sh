#!/bin/bash

echo "🚀 Установка Docker в пользовательском режиме (без sudo)"
echo "======================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверяем, что мы НЕ root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Этот скрипт НЕ должен быть запущен с правами sudo${NC}"
    echo "Запустите: ./install-docker-usermode.sh"
    exit 1
fi

# Создаем директории
mkdir -p ~/.local/bin
mkdir -p ~/.docker

echo -e "${YELLOW}1. Скачивание Docker binaries...${NC}"
DOCKER_VERSION="28.4.0"
curl -fsSL "https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz" -o docker.tgz

echo -e "${YELLOW}2. Распаковка Docker...${NC}"
tar xzf docker.tgz
mv docker/* ~/.local/bin/
rm -rf docker docker.tgz

echo -e "${YELLOW}3. Скачивание Docker Compose...${NC}"
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o ~/.local/bin/docker-compose
chmod +x ~/.local/bin/docker-compose

echo -e "${YELLOW}4. Настройка PATH...${NC}"
# Добавляем ~/.local/bin в PATH если его там нет
if ! echo $PATH | grep -q "$HOME/.local/bin"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    export PATH="$HOME/.local/bin:$PATH"
fi

echo -e "${YELLOW}5. Создание конфигурации для rootless Docker...${NC}"
cat > ~/.docker/daemon.json << EOF
{
  "experimental": true,
  "storage-driver": "vfs"
}
EOF

echo -e "${YELLOW}6. Запуск Docker daemon в rootless режиме...${NC}"
# Запускаем Docker daemon в фоне
dockerd-rootless.sh --experimental --storage-driver vfs > ~/.docker/daemon.log 2>&1 &
sleep 5

echo -e "${YELLOW}7. Проверка установки...${NC}"
~/.local/bin/docker --version
~/.local/bin/docker-compose --version

echo -e "${GREEN}✅ Docker установлен в пользовательском режиме!${NC}"
echo
echo -e "${YELLOW}Для использования:${NC}"
echo "1. Перезапустите терминал или выполните: source ~/.bashrc"
echo "2. Используйте: docker-compose up -d"
echo
echo -e "${YELLOW}Примечание:${NC}"
echo "Docker работает в rootless режиме с ограничениями:"
echo "- Некоторые функции могут быть недоступны"
echo "- Производительность может быть ниже"
echo "- Для полной функциональности рекомендуется установка с sudo"
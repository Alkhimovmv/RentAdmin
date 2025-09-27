# ☁️ Развертывание RentAdmin на cloud.ru

Готовое решение для развертывания приложения RentAdmin на сервере cloud.ru с доступом по HTTP по IP адресу.

## 🚀 Быстрый старт

### Вариант 1: Автоматическое развертывание (рекомендуется)
```bash
# На сервере cloud.ru выполните:
sudo ./deploy-cloud-http.sh
```

### Вариант 2: Ультра-быстрое развертывание
```bash
# Минимальная установка (5 минут):
sudo ./quick-deploy-cloud.sh
```

## 📋 Что делают скрипты:

### `deploy-cloud-http.sh` - Полное развертывание
- ✅ Устанавливает все необходимые пакеты (nginx, nodejs, npm, sqlite3)
- ✅ Настраивает файрвол (порты 22, 80)
- ✅ Создает пользователя `rentadmin`
- ✅ Собирает фронтенд с правильным API URL
- ✅ Собирает бэкенд с SQLite базой данных
- ✅ Настраивает nginx для проксирования API
- ✅ Создает systemd сервис для автозапуска
- ✅ Настраивает логирование
- ✅ Проверяет работоспособность

### `quick-deploy-cloud.sh` - Быстрое развертывание
- ⚡ Минимальная установка за 3-5 минут
- ⚡ Только необходимые компоненты
- ⚡ Простая конфигурация

## 🎯 Результат развертывания

После успешного выполнения любого скрипта:

```
🌍 Веб-интерфейс: http://ВАШ_IP_СЕРВЕРА/
🎯 Backend API:   http://ВАШ_IP_СЕРВЕРА/api
🏥 Health check:  http://ВАШ_IP_СЕРВЕРА/health
```

## 📋 Требования к серверу

### Минимальные:
- **OS**: Ubuntu 20.04+ / Debian 11+
- **RAM**: 1 GB
- **CPU**: 1 vCPU
- **Диск**: 10 GB
- **Права**: sudo доступ

### Рекомендуемые:
- **RAM**: 2 GB+
- **CPU**: 2 vCPU+
- **Диск**: 20 GB+

## 🔧 Управление приложением

### Проверка статуса
```bash
sudo systemctl status rentadmin
sudo systemctl status nginx
```

### Перезапуск
```bash
sudo systemctl restart rentadmin
sudo systemctl restart nginx
```

### Логи
```bash
# Логи приложения
sudo journalctl -u rentadmin -f

# Логи nginx
sudo tail -f /var/log/nginx/access.log
```

### Обновление
```bash
# Остановка
sudo systemctl stop rentadmin

# Обновление кода (git pull или копирование новых файлов)
# Сборка
cd /opt/rentadmin/backend && sudo -u rentadmin npm run build
cd /opt/rentadmin/frontend && sudo -u rentadmin npm run build
sudo cp -r /opt/rentadmin/frontend/dist/* /var/www/html/rentadmin/

# Запуск
sudo systemctl start rentadmin
```

## 🌐 Архитектура решения

```
Интернет → nginx (порт 80) ┌─→ Фронтенд (статические файлы)
                           └─→ /api/* → Backend (порт 3001) → SQLite
```

### Что настроено:
- **nginx** - веб-сервер и reverse proxy
- **Frontend** - React приложение (статические файлы)
- **Backend** - Node.js API сервер
- **Database** - SQLite (файл базы данных)
- **systemd** - автозапуск приложения

## 🔒 Безопасность

### Настроенные меры:
- ✅ Файрвол UFW (только порты 22, 80)
- ✅ Отдельный пользователь для приложения
- ✅ CORS настроен правильно
- ✅ Безопасные заголовки nginx
- ✅ Скрытие служебных файлов

### Дополнительные рекомендации:
```bash
# Смена пароля root
sudo passwd

# Настройка SSH ключей
ssh-keygen -t rsa -b 4096

# Отключение password авторизации (опционально)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

## 🆘 Устранение проблем

### Приложение не запускается
```bash
# Проверка логов
sudo journalctl -u rentadmin -n 50

# Ручной запуск для диагностики
cd /opt/rentadmin/backend
sudo -u rentadmin npm start
```

### Фронтенд не загружается
```bash
# Проверка nginx
sudo nginx -t
sudo systemctl restart nginx

# Проверка файлов
ls -la /var/www/html/rentadmin/
```

### API недоступен
```bash
# Проверка бэкенда
curl http://localhost:3001/api/health

# Проверка прокси
curl http://localhost/api/health
```

## 📞 Получение помощи

### Сбор информации для диагностики:
```bash
# Системная информация
uname -a
cat /etc/os-release

# Статус сервисов
sudo systemctl status rentadmin nginx

# Логи
sudo journalctl -u rentadmin -n 20
sudo tail -20 /var/log/nginx/error.log

# Сетевые подключения
sudo netstat -tlnp | grep -E ':80|:3001'

# Использование ресурсов
free -h
df -h
```

## ✅ Checklist после развертывания

- [ ] Приложение доступно по `http://ВАШ_IP/`
- [ ] API отвечает на `http://ВАШ_IP/api/health`
- [ ] Сервисы автоматически запускаются: `sudo systemctl is-enabled rentadmin nginx`
- [ ] Файрвол настроен: `sudo ufw status`
- [ ] Логи пишутся: `sudo journalctl -u rentadmin -n 5`

## 🎉 Готово!

После успешного развертывания ваше приложение RentAdmin будет:
- 🌍 Доступно по IP адресу сервера
- 🔄 Автоматически запускаться при перезагрузке
- 📊 Логировать работу для мониторинга
- ⚡ Работать стабильно в production режиме

**Поздравляем с успешным развертыванием!** 🚀
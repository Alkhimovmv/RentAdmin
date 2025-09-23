# 🌐 Настройка Netlify для RentAdmin Frontend

## 📋 Пошаговая инструкция

### 1. Подготовка репозитория
Убедитесь, что ваш код загружен в GitHub, GitLab или Bitbucket.

### 2. Создание сайта в Netlify

1. Войдите в [Netlify](https://netlify.com)
2. Нажмите "New site from Git"
3. Выберите ваш Git провайдер
4. Выберите репозиторий RentAdmin
5. Настройте параметры сборки:

**Настройки сборки:**
```
Branch to deploy: main
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

### 3. Настройка переменных окружения

В настройках сайта (Site settings → Environment variables) добавьте:

```
VITE_API_URL=https://87.242.103.146/api
```

**Backend на Cloud.ru:** IP адрес `87.242.103.146`

### 4. Настройка редиректов для SPA

Создайте файл `frontend/public/_redirects` с содержимым:
```
/*    /index.html   200
```

### 5. Настройка заголовков безопасности (опционально)

Создайте файл `frontend/public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 🔧 Настройка кастомного домена

### 1. В настройках Netlify
1. Перейдите в Domain settings
2. Нажмите "Add custom domain"
3. Введите ваш домен (например: rentadmin.yourdomain.com)

### 2. Настройка DNS
Добавьте CNAME запись в настройках вашего домена:
```
rentadmin.yourdomain.com → your-site-name.netlify.app
```

### 3. SSL сертификат
Netlify автоматически выпустит Let's Encrypt сертификат для вашего домена.

## 🚀 Процесс развертывания

### Автоматическое развертывание
- При каждом push в ветку `main` Netlify автоматически пересобирает сайт
- Сборка занимает обычно 1-3 минуты

### Ручное развертывание
1. Зайдите в Deploys
2. Нажмите "Trigger deploy"
3. Выберите "Deploy site"

## 🔍 Проверка подключения к API

После развертывания проверьте:

1. **Открытие сайта**: Убедитесь, что фронтенд загружается
2. **API подключение**: Проверьте в DevTools → Network, что запросы идут на правильный API URL
3. **CORS**: Убедитесь, что на сервере Cloud.ru настроен CORS для вашего Netlify домена

## ⚠️ Важные моменты

### CORS настройка на сервере
Убедитесь, что в `.env.cloud` на сервере указан правильный FRONTEND_URL:
```
FRONTEND_URL=https://vozmimenjaadmin.netlify.app
CORS_ORIGIN=https://vozmimenjaadmin.netlify.app
```

### HTTPS обязателен
- Netlify автоматически обеспечивает HTTPS
- Убедитесь, что API на Cloud.ru также работает по HTTPS

## 🛠️ Отладка проблем

### Ошибки сборки
1. Проверьте логи сборки в Netlify
2. Убедитесь, что все зависимости установлены
3. Проверьте Node.js версию (должна быть 18+)

### Проблемы с API
1. Проверьте переменную VITE_API_URL
2. Убедитесь, что сервер на Cloud.ru доступен
3. Проверьте CORS настройки

### Проблемы с роутингом
1. Убедитесь, что файл `_redirects` создан
2. Проверьте настройки React Router

## 📱 Дополнительные возможности

### Превью деплоев
- Netlify создает превью для каждого Pull Request
- Удобно для тестирования изменений

### Формы
- Netlify поддерживает обработку форм без сервера
- Полезно для контактных форм

### Функции
- Можно создавать serverless функции
- Альтернатива некоторым API endpoints

---

✅ **После выполнения всех шагов ваш фронтенд будет доступен по адресу Netlify и подключен к API на Cloud.ru!**
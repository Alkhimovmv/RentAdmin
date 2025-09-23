# RentAdmin - Система управления арендой оборудования

Полнофункциональное веб-приложение для администрирования аренды оборудования с современным интерфейсом и мощным API.

## 🚀 Возможности

### Основной функционал
- 🔐 **Аутентификация по пин-коду** (20031997)
- 📋 **Управление арендами** - полный CRUD с отслеживанием статусов
- 📊 **График аренд** - интерактивная диаграмма Ганта
- 👥 **Управление клиентами** - статистика и история аренд
- 🎥 **Каталог оборудования** - управление инвентарем
- 💰 **Финансовая аналитика** - доходы, расходы, прибыль

### Цветовое кодирование статусов
- 🟢 **Зеленый** - завершенные аренды
- 🟡 **Желтый** - активные аренды
- 🔴 **Красный** - просроченные аренды
- ⚪ **Серый** - ожидающие аренды

### Оборудование по умолчанию
- 6x GoPro 13 (1500₽)
- 2x DJI Osmo Pocket 3 (2000₽)
- 5x Karcher SC4 (800₽)
- 8x Karcher Puzzi 8/1 (1000₽)
- 1x Karcher Puzzi 10/1 (1200₽)
- 1x Karcher WD5 (600₽)
- 1x Okami Q75 (1800₽)
- 1x DJI Mic 2 (1200₽)

## 🛠 Технологический стек

### Frontend
- **React 18** с TypeScript
- **Vite** - быстрая сборка
- **Tailwind CSS** - стилизация
- **Tanstack Query** - управление состоянием сервера
- **React Router** - маршрутизация
- **Axios** - HTTP клиент
- **date-fns** - работа с датами

### Backend
- **Node.js + Express** с TypeScript
- **PostgreSQL** - основная база данных
- **Knex.js** - query builder и миграции
- **JWT** - аутентификация
- **Pino** - логирование
- **class-validator** - валидация

### DevOps
- **Docker** - контейнеризация
- **Docker Compose** - оркестрация
- **Jest/Vitest** - тестирование
- **ESLint + Prettier** - качество кода

## 🚀 Быстрый запуск

### С помощью Docker (рекомендуется)

```bash
# Клонировать репозиторий
git clone <repository-url>
cd RentAdmin

# Запустить все сервисы
docker-compose up -d

# Приложение будет доступно по адресу:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Локальная разработка

#### Требования
- Node.js 18+
- PostgreSQL 15+
- npm или yarn

#### Backend

```bash
cd backend

# Установить зависимости
npm install

# Настроить базу данных
cp .env.example .env
# Отредактировать .env с настройками БД

# Запустить миграции и seeds
npm run db:migrate
npm run db:seed

# Запуск в режиме разработки
npm run dev

# Запуск в production режиме
npm run build
npm start
```

#### Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для production
npm run build
npm run preview
```

## 🧪 Тестирование

### Backend тесты

```bash
cd backend
npm test                # Запуск всех тестов
npm run test:watch      # Тесты в watch режиме
npm run test:coverage   # Тесты с покрытием
```

### Frontend тесты

```bash
cd frontend
npm test                # Запуск всех тестов
npm run test:watch      # Тесты в watch режиме
npm run test:coverage   # Тесты с покрытием
```

## 📝 API Документация

### Аутентификация
- `POST /api/auth/login` - Вход по пин-коду
- `GET /api/auth/verify` - Проверка токена

### Оборудование
- `GET /api/equipment` - Список оборудования
- `POST /api/equipment` - Создание оборудования
- `PUT /api/equipment/:id` - Обновление оборудования
- `DELETE /api/equipment/:id` - Удаление оборудования

### Аренды
- `GET /api/rentals` - Список аренд
- `GET /api/rentals/gantt` - Данные для диаграммы Ганта
- `POST /api/rentals` - Создание аренды
- `PUT /api/rentals/:id` - Обновление аренды
- `DELETE /api/rentals/:id` - Удаление аренды

### Клиенты
- `GET /api/customers` - Список клиентов
- `GET /api/customers/:phone/rentals` - Аренды клиента

### Аналитика
- `GET /api/analytics/monthly-revenue` - Помесячная выручка
- `GET /api/analytics/equipment-utilization` - Загрузка оборудования
- `GET /api/analytics/financial-summary` - Финансовая сводка

### Расходы
- `GET /api/expenses` - Список расходов
- `POST /api/expenses` - Создание расхода
- `PUT /api/expenses/:id` - Обновление расхода
- `DELETE /api/expenses/:id` - Удаление расхода

## 🔧 Переменные окружения

### Backend (.env)
```bash
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rent_admin
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key

# Authentication
PIN_CODE=20031997
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001/api
```

## 📊 Функции приложения

### 1. Управление арендами
- Создание, редактирование, удаление аренд
- Отслеживание статусов в реальном времени
- Поддержка доставки с расчетом стоимости
- Комментарии и источники лидов

### 2. График аренд (Диаграмма Ганта)
- Визуализация занятости оборудования
- Навигация по неделям
- Тултипы с детальной информацией
- Цветовое кодирование статусов

### 3. Управление клиентами
- Автоматическое создание профилей
- Статистика аренд
- Классификация клиентов (VIP, постоянные, новые)

### 4. Каталог оборудования
- Управление инвентарем
- Отслеживание количества
- Базовые цены аренды

### 5. Финансовая аналитика
- Помесячная прибыль
- Отчеты по доходам и расходам
- Аналитика по источникам
- Управление операционными расходами

## 🏗 Архитектура

### Frontend архитектура
```
src/
├── api/           # HTTP клиенты для API
├── components/    # Переиспользуемые компоненты
├── hooks/         # Кастомные React хуки
├── pages/         # Страницы приложения
├── types/         # TypeScript типы
├── utils/         # Утилиты
└── __tests__/     # Тесты
```

### Backend архитектура
```
src/
├── controllers/   # Контроллеры API
├── middleware/    # Express middleware
├── models/        # TypeScript типы
├── routes/        # Маршруты API
├── utils/         # Утилиты
├── migrations/    # Миграции БД
├── seeds/         # Начальные данные
└── __tests__/     # Тесты
```

## 🚀 Production деплой

### Docker Compose (рекомендуется)
```bash
# Клонировать и запустить
git clone <repository-url>
cd RentAdmin
docker-compose up -d
```

### Ручной деплой
1. Настроить PostgreSQL базу данных
2. Собрать и запустить backend
3. Собрать frontend и настроить веб-сервер
4. Настроить reverse proxy (nginx)

## 🤝 Разработка

### Требования к коду
- TypeScript strict mode
- ESLint + Prettier форматирование
- 100% покрытие тестами критических путей
- Комментарии для публичных API

### Git workflow
1. Создать feature branch
2. Написать код и тесты
3. Запустить линтеры и тесты
4. Создать Pull Request

## 📄 Лицензия

MIT License

## 👥 Поддержка

При возникновении вопросов или проблем создайте issue в репозитории.
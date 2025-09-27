# 🚀 Быстрый запуск RentAdmin

Этот проект включает полный стек: Backend (Node.js + SQLite) и Frontend (React + Vite).

## 📦 Запуск всего проекта одной командой

### Вариант 1: Использование npm скриптов
```bash
npm run start
# или
npm run dev
```

### Вариант 2: Прямой запуск скрипта
```bash
./start-fullstack.sh
```

## 🎯 Что запускается:

1. **Backend** на `http://localhost:3001`
   - API доступно по `http://localhost:3001/api`
   - SQLite база данных создается автоматически
   - Миграции выполняются автоматически

2. **Frontend** на `http://localhost:5173`
   - React приложение с Vite dev server
   - Автоматически подключается к локальному API
   - Hot reload включен

## 🛑 Остановка сервисов

### Вариант 1: npm скрипт
```bash
npm run stop
```

### Вариант 2: Прямой запуск скрипта
```bash
./stop-fullstack.sh
```

### Вариант 3: Ctrl+C в терминале
Если запускали в интерактивном режиме, просто нажмите `Ctrl+C`

## 📋 Доступные команды

```bash
npm run start      # Запуск полного стека
npm run dev        # То же что и start
npm run stop       # Остановка всех сервисов
npm run backend    # Только backend
npm run frontend   # Только frontend
npm run build      # Сборка backend + frontend
```

## 🔧 Конфигурация

### Backend
- **Порт**: 3001
- **База данных**: SQLite (`backend/dev.sqlite3`)
- **API**: `http://localhost:3001/api`

### Frontend
- **Порт**: 5173
- **Dev server**: Vite
- **API endpoint**: `http://localhost:3001/api`

## 🎯 Первый запуск

При первом запуске автоматически:
1. Устанавливаются зависимости (если не установлены)
2. Создается SQLite база данных
3. Выполняются миграции базы данных
4. Собирается backend
5. Запускаются оба сервиса

## 🌐 Доступ к приложению

После запуска откройте в браузере:
- **Приложение**: http://localhost:5173
- **API документация**: http://localhost:3001/api/health

## 🚨 Устранение неполадок

### Backend не запускается
```bash
cd backend
npm install
npm run build
npm start
```

### Frontend не запускается
```bash
cd frontend
npm install
npm run dev
```

### Очистка и полный перезапуск
```bash
npm run stop
rm -rf backend/node_modules frontend/node_modules
rm -f backend/dev.sqlite3
npm run start
```

## 📊 Логи

Логи отображаются в консоли при запуске. Для отдельного просмотра:
- Backend логи видны в терминале
- Frontend логи видны в терминале и браузере (DevTools)

## 🎉 Готово!

Теперь у вас запущен полный стек RentAdmin локально!
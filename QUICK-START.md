# 🚀 Быстрый старт - Шпаргалка

## Обновление фронтенда на сервере (самое частое)

```bash
./quick-frontend-update.sh
```

**Это всё!** Скрипт автоматически:
- ✅ Сделает `git pull`
- ✅ Установит зависимости
- ✅ Пересоберет фронт
- ✅ Перезапустит nginx

⏱️ Занимает ~2-3 минуты

---

## Создать бэкап БД

```bash
cd backend
npm run db:backup
```

---

## Полный деплой (backend + frontend)

```bash
./deploy-vm.sh
```

---

## Применить миграции БД

```bash
cd backend
npm run db:migrate
```

---

## Локальная разработка

### Backend
```bash
cd backend
npm run dev    # Порт 3001
```

### Frontend
```bash
cd frontend
npm run dev    # Порт 5174
```

---

📖 **Подробная документация:** [SCRIPTS-GUIDE.md](SCRIPTS-GUIDE.md)

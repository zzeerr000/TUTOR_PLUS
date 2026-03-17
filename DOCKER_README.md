# Docker для TutorPlus

## Требования
- Docker
- Docker Compose

## Запуск приложения

### Полный запуск (бэкенд + фронтенд)
```bash
docker-compose up --build
```

### Запуск только бэкенда
```bash
docker-compose up backend --build
```

### Запуск только фронтенда
```bash
docker-compose up frontend --build
```

### Запуск в фоновом режиме
```bash
docker-compose up -d --build
```

### Остановка
```bash
docker-compose down
```

### Остановка с удалением volumes
```bash
docker-compose down -v
```

## Структура

### Бэкенд (NestJS)
- **backend/** - NestJS приложение с SQLite
- **uploads/** - Загруженные файлы
- **tutorplus.db** - База данных SQLite

### Фронтенд (React + Vite)
- **frontend/** - React/Vite приложение
- Сборка через multi-stage Docker
- Обслуживание через nginx
- Поддержка React Router

## Порты
- Бэкенд: http://localhost:3000
- Фронтенд: http://localhost:5173

## Переменные окружения

### Бэкенд
- `NODE_ENV=production` - Режим работы

### Фронтенд  
- Конфигурация через nginx.conf
- Автоматическое проксирование API запросов на бэкенд

## Volume (сохранение данных)
- `./backend/uploads:/app/uploads` - Загруженные файлы
- `./backend/tutorplus.db:/app/tutorplus.db` - База данных

## Health checks
Оба контейнера имеют health checks для мониторинга состояния.

## Оптимизация

### Бэкенд
- Легкий образ node:18-alpine
- Пользователь без прав root
- Только production зависимости

### Фронтенд
- Multi-stage build
- nginx:alpine для production
- Gzip сжатие
- Кеширование статических файлов
- Безопасные заголовки

## Разработка
Для разработки используйте обычный запуск:
```bash
# Бэкенд
cd backend && npm run dev

# Фронтенд
cd frontend && npm run dev
```

## Проблемы и решения

1. **Порт занят** - измените порт в docker-compose.yml
2. **База данных не создается** - убедитесь что volume смонтирован корректно
3. **Файлы не загружаются** - проверьте права доступа к папке uploads
4. **Фронтенд не загружается** - проверьте конфигурацию nginx
5. **API запросы не работают** - убедитесь что бэкенд запущен и доступен

## Nginx конфигурация
Фронтенд использует nginx с:
- Поддержкой React Router
- Gzip сжатием
- Кешированием статических файлов
- Безопасными заголовками
- Проксированием API запросов

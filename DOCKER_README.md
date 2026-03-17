# Docker для TutorPlus

## Требования
- Docker
- Docker Compose

## Запуск приложения

### Полный запуск (бэкенд + фронтенд + PostgreSQL)
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

### PostgreSQL
- **postgres:15-alpine** - Официальный образ PostgreSQL
- **postgres_data** - Volume для хранения данных БД
- **tutorplus** - Имя базы данных
- Автоматический health check

### Бэкенд (NestJS)
- **backend/** - NestJS приложение с PostgreSQL
- **uploads/** - Загруженные файлы
- Подключение к PostgreSQL через переменные окружения

### Фронтенд (React + Vite)
- **frontend/** - React/Vite приложение
- Сборка через multi-stage Docker
- Обслуживание через nginx
- Поддержка React Router

## Порты
- PostgreSQL: localhost:5432
- Бэкенд: http://localhost:3000
- Фронтенд: http://localhost:5173

## Переменные окружения

### Бэкенд
- `NODE_ENV=production` - Режим работы
- `DB_HOST=postgres` - Хост PostgreSQL
- `DB_PORT=5432` - Порт PostgreSQL
- `DB_USERNAME=postgres` - Пользователь БД
- `DB_PASSWORD=postgres123` - Пароль БД
- `DB_DATABASE=tutorplus` - Имя БД
- `JWT_SECRET` - Секрет для JWT токенов
- `JWT_EXPIRES_IN=7d` - Срок жизни JWT

### PostgreSQL
- `POSTGRES_USER=postgres` - Пользователь
- `POSTGRES_PASSWORD=postgres123` - Пароль
- `POSTGRES_DB=tutorplus` - База данных

### Фронтенд  
- Конфигурация через nginx.conf
- Автоматическое проксирование API запросов на бэкенд

## Volume (сохранение данных)
- `postgres_data:/var/lib/postgresql/data` - Данные PostgreSQL
- `./backend/uploads:/app/uploads` - Загруженные файлы

## Health checks
Все контейнеры имеют health checks для мониторинга состояния.

## Оптимизация

### PostgreSQL
- Легкий образ postgres:15-alpine
- Persistent volume для данных
- Автоматическое восстановление после перезапуска

### Бэкенд
- Легкий образ node:18-alpine
- Пользователь без прав root
- Только production зависимости
- Ожидание готовности PostgreSQL перед запуском

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

# PostgreSQL (нужен локально)
psql -h localhost -p 5432 -U postgres -d tutorplus
```

## Миграция с SQLite на PostgreSQL

1. **Резервное копирование данных** (если нужно сохранить данные)
2. **Обновление зависимостей** - `pg` добавлен, `sqlite3` удален
3. **Обновление конфигурации** - TypeORM настроен на PostgreSQL
4. **Переменные окружения** - Добавлены переменные для подключения к PostgreSQL
5. **Docker Compose** - Добавлен сервис PostgreSQL

## Проблемы и решения

1. **Порт занят** - измените порт в docker-compose.yml
2. **PostgreSQL не запускается** - проверьте логи `docker-compose logs postgres`
3. **Бэкенд не подключается к БД** - убедитесь что PostgreSQL готов
4. **Файлы не загружаются** - проверьте права доступа к папке uploads
5. **Фронтенд не загружается** - проверьте конфигурацию nginx
6. **API запросы не работают** - убедитесь что бэкенд запущен и доступен

## Nginx конфигурация
Фронтенд использует nginx с:
- Поддержкой React Router
- Gzip сжатием
- Кешированием статических файлов
- Безопасными заголовками
- Проксированием API запросов

## Управление базой данных

### Подключение к PostgreSQL
```bash
docker-compose exec postgres psql -U postgres -d tutorplus
```

### Просмотр таблиц
```sql
\dt
```

### Резервное копирование
```bash
docker-compose exec postgres pg_dump -U postgres tutorplus > backup.sql
```

### Восстановление
```bash
docker-compose exec -T postgres psql -U postgres tutorplus < backup.sql
```

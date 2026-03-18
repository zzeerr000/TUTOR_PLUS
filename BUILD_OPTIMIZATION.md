# Оптимизация сборки Docker для TutorPlus

## Быстрые команды для разработки

### Пересборка без кэша
```bash
docker-compose build --no-cache
```

### Пересборка только одного сервиса
```bash
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

### Параллельная сборка
```bash
docker-compose build --parallel
```

### Использование BuildKit для ускорения
```bash
DOCKER_BUILDKIT=1 docker-compose build
```

## Оптимизации в Dockerfiles

### Фронтенд:
- ✅ `npm ci --only=production` - только production зависимости
- ✅ `--silent` - меньше логов, быстрее сборка
- ✅ Multi-stage build - уменьшение размера образа
- ✅ Улучшенный .dockerignore - исключение лишних файлов

### Бэкенд:
- ✅ `npm ci --silent` - быстрая установка зависимостей
- ✅ Объединенные RUN команды - меньше слоев
- ✅ Кэширование package.json - быстрее пересборка

## Ожидаемое ускорение:
- **Фронтенд:** 2-3x быстрее (кэширование зависимостей)
- **Бэкенд:** 2x быстрее (оптимизация npm ci)
- **Общая сборка:** 50-70% быстрее

## Мониторинг сборки:
```bash
# Просмотр времени сборки
time docker-compose up --build

# Просмотр логов сборки
docker-compose build --progress=plain
```

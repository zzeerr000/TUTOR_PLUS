# Multi-stage build для оптимизации размера образа
FROM node:20-alpine as builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем только package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости с кэшированием
RUN npm ci --only=production --silent

# Копируем исходный код
COPY . .

# Собираем приложение с оптимизацией
RUN npm run build

# Production stage
FROM nginx:alpine

# Устанавливаем дополнительные пакеты если нужны
RUN apk add --no-cache dumb-init

# Копируем собранные файлы из builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем конфигурацию nginx из builder stage
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Создаем пользователя без прав root для безопасности
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Устанавливаем права
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Переключаемся на пользователя nginx
USER nginx

# Открываем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]

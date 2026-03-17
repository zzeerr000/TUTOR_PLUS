# Multi-stage build для оптимизации размера образа
FROM node:18-alpine as builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы управления зависимостями
COPY package*.json ./

# Устанавливаем все зависимости (включая devDependencies для сборки)
RUN npm ci

# Копируем исходный код и nginx.conf
COPY . .

# Собираем приложение
RUN npm run build

# Production stage
FROM nginx:alpine

# Копируем собранные файлы из builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем конфигурацию nginx из builder stage
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 5173

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]

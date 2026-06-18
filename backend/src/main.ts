import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const defaultOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://localhost",
    "capacitor://localhost",
    "http://localhost",
  ];
  const extraOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: [...defaultOrigins, ...extraOrigins],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Serve static files
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(3000, "0.0.0.0");
  console.log("Backend server running on http://0.0.0.0:3000");
}
bootstrap();


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Создаем необходимые директории при запуске
  const uploadsDir = join(process.cwd(), 'uploads');
  const avatarsDir = join(uploadsDir, 'avatars');
  const homeworkDir = join(uploadsDir, 'homework');
  
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    if (!fs.existsSync(homeworkDir)) {
      fs.mkdirSync(homeworkDir, { recursive: true });
    }
    console.log('Upload directories created successfully');
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve static files
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(3000);
  console.log('Backend server running on http://localhost:3000');
}
bootstrap();


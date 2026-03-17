import { Controller, Get, Post, Put, Body, Request, UseGuards, UploadedFile, UseInterceptors, BadRequestException, ForbiddenException, Delete, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectionsService } from '../connections/connections.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ConnectionsService))
    private readonly connectionsService: ConnectionsService,
  ) {}

  @Get('code')
  async getCode(@Request() req) {
    return { code: await this.usersService.getOrGenerateCode(req.user.sub) };
  }

  @Get('students')
  async getStudents(@Request() req) {
    if (req.user.role !== 'tutor') {
      return [];
    }
    // Return only connected students with connection metadata
    const connections = await this.connectionsService.getConnections(
      req.user.sub,
      req.user.role
    );
    return connections.map((c) => ({
      ...c.student,
      connectionId: c.id,
      studentAlias: c.studentAlias,
      defaultSubject: c.defaultSubject,
      defaultPrice: c.defaultPrice,
      defaultDuration: c.defaultDuration,
    }));
  }

  @Post('students')
  async createStudent(@Body() createStudentDto: { email: string; password: string; name: string }, @Request() req) {
    if (req.user.role !== 'tutor') {
      throw new ForbiddenException('Only tutors can create students');
    }
    return this.usersService.create(createStudentDto.email, createStudentDto.password, createStudentDto.name, 'student');
  }

  @Put('profile/name')
  async updateName(@Body() body: { name: string }, @Request() req) {
    return this.usersService.updateName(req.user.sub, body.name);
  }

  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Создаем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = extname(file.originalname);
    const userId = (req.user as any).sub;
    const filename = `${userId}-${uniqueSuffix}${ext}`;
    
    // Создаем директорию если она не существует
    const uploadDir = '/app/uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Сохраняем файл
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    
    const avatarUrl = `/uploads/avatars/${filename}`;
    console.log('Avatar uploaded:', avatarUrl, 'for user:', userId);
    return this.usersService.updateAvatar(userId, avatarUrl);
  }

  @Delete('profile/avatar')
  async removeAvatar(@Request() req) {
    console.log('Avatar removed for user:', (req.user as any).sub);
    return this.usersService.updateAvatar((req.user as any).sub, null);
  }

  @Delete('profile')
  async deleteAccount(@Request() req) {
    await this.usersService.deleteAccount((req.user as any).sub);
    return { message: 'Account deleted successfully' };
  }
}


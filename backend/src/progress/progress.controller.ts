import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  findAll(@Request() req) {
    return this.progressService.findAll(req.user.sub, req.user.role);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.progressService.getOverallStats(req.user.sub, req.user.role);
  }

  @Post()
  create(@Body() createProgressDto: any, @Request() req) {
    return this.progressService.create({
      ...createProgressDto,
      tutorId: req.user.role === 'tutor' ? req.user.sub : createProgressDto.tutorId,
      studentId: req.user.role === 'student' ? req.user.sub : createProgressDto.studentId,
    });
  }
}


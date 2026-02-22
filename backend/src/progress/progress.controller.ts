import { Controller, Get, Post, Body, UseGuards, Request, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
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

  @Get('history/:tutorId')
  getSubjectHistory(@Param('tutorId', ParseIntPipe) tutorId: number, @Request() req) {
    if (req.user.role !== 'student') {
        throw new BadRequestException('Only students can view their subject history');
    }
    return this.progressService.getSubjectHistory(req.user.sub, tutorId);
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


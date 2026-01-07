import { Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get()
  findAll(@Request() req) {
    return this.financeService.findAll(req.user.sub, req.user.role);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.financeService.getStats(req.user.sub, req.user.role);
  }

  @Post()
  create(@Body() createTransactionDto: any, @Request() req) {
    return this.financeService.create({
      ...createTransactionDto,
      tutorId: req.user.role === 'tutor' ? req.user.sub : createTransactionDto.tutorId,
      studentId: req.user.role === 'student' ? req.user.sub : createTransactionDto.studentId,
    });
  }

  @Put(':id/confirm')
  async confirmPayment(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== 'tutor') {
      throw new ForbiddenException('Only tutors can confirm payments');
    }
    return this.financeService.confirmPayment(id, req.user.sub);
  }
}


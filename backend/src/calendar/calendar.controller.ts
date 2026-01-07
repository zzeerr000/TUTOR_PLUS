import { Controller, Get, Post, Put, Body, Delete, Param, UseGuards, Request, ForbiddenException, ParseIntPipe, Inject, forwardRef } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinanceService } from '../finance/finance.service';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    @Inject(forwardRef(() => FinanceService))
    private readonly financeService: FinanceService,
  ) {}

  @Get()
  findAll(@Request() req) {
    return this.calendarService.findAll(req.user.sub, req.user.role);
  }

  @Post()
  async create(@Body() createEventDto: any, @Request() req) {
    const tutorId = req.user.role === 'tutor' ? req.user.sub : createEventDto.tutorId;
    const studentId = req.user.role === 'student' ? req.user.sub : createEventDto.studentId;
    
    // Verify connection exists
    await this.calendarService.verifyConnection(tutorId, studentId);
    
    return this.calendarService.create({
      ...createEventDto,
      tutorId,
      studentId,
    });
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateEventDto: any, @Request() req) {
    const tutorId = req.user.role === 'tutor' ? req.user.sub : updateEventDto.tutorId;
    const studentId = req.user.role === 'student' ? req.user.sub : updateEventDto.studentId;
    
    // Verify connection exists
    await this.calendarService.verifyConnection(tutorId, studentId);
    
    // Verify the event belongs to this tutor
    const event = await this.calendarService.findOne(id);
    if (event && event.tutorId !== req.user.sub && req.user.role === 'tutor') {
      throw new ForbiddenException('You can only edit your own lessons');
    }
    
    return this.calendarService.update(id, {
      ...updateEventDto,
      tutorId,
      studentId,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    // Only tutors can delete events
    if (req.user.role !== 'tutor') {
      throw new ForbiddenException('Only tutors can delete lessons');
    }
    // Verify the event belongs to this tutor
    const event = await this.calendarService.findOne(+id);
    if (event && event.tutorId !== req.user.sub) {
      throw new ForbiddenException('You can only delete your own lessons');
    }
    return this.calendarService.remove(+id);
  }
}


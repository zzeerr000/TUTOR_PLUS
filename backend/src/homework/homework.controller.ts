import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { HomeworkService } from './homework.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('homework')
@UseGuards(JwtAuthGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Get()
  findAll(@Request() req) {
    return this.homeworkService.findAll(req.user.sub, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.homeworkService.findOne(id, req.user.sub, req.user.role);
  }

  @Post()
  create(@Body() createDto: any, @Request() req) {
    if (req.user.role !== 'tutor') {
      throw new ForbiddenException('Only tutors can create homework');
    }
    return this.homeworkService.create(createDto, req.user.sub);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: any,
    @Request() req,
  ) {
    return this.homeworkService.update(id, updateDto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (req.user.role !== 'tutor') {
      throw new ForbiddenException('Only tutors can delete homework');
    }
    return this.homeworkService.delete(id, req.user.sub);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeworkController } from './homework.controller';
import { HomeworkService } from './homework.service';
import { Homework } from './entities/homework.entity';
import { Event } from '../calendar/entities/event.entity';
import { FileEntity } from '../files/entities/file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Homework, Event, FileEntity]),
  ],
  controllers: [HomeworkController],
  providers: [HomeworkService],
  exports: [HomeworkService],
})
export class HomeworkModule {}

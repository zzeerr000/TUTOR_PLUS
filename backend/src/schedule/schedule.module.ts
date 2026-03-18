import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ScheduleService } from './schedule.service';
import { FinanceModule } from '../finance/finance.module';
import { HomeworkModule } from '../homework/homework.module';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    FinanceModule,
    HomeworkModule,
  ],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}

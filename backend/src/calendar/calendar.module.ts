import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { Event } from './entities/event.entity';
import { Homework } from '../homework/entities/homework.entity';
import { ConnectionsModule } from '../connections/connections.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Homework]),
    forwardRef(() => ConnectionsModule),
    forwardRef(() => FinanceModule),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}


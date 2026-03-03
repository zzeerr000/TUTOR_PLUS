import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { Progress } from './entities/progress.entity';
import { ConnectionsModule } from '../connections/connections.module';
import { CalendarModule } from '../calendar/calendar.module';
import { HomeworkModule } from '../homework/homework.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Progress]),
    forwardRef(() => ConnectionsModule),
    forwardRef(() => CalendarModule),
    forwardRef(() => HomeworkModule),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { MessagesModule } from './messages/messages.module';
import { FilesModule } from './files/files.module';
import { FinanceModule } from './finance/finance.module';
import { CalendarModule } from './calendar/calendar.module';
import { ProgressModule } from './progress/progress.module';
import { ConnectionsModule } from './connections/connections.module';
import { AppController } from './app.controller';
import { User } from './users/entities/user.entity';
import { Task } from './tasks/entities/task.entity';
import { Message } from './messages/entities/message.entity';
import { FileEntity } from './files/entities/file.entity';
import { Transaction } from './finance/entities/transaction.entity';
import { Event } from './calendar/entities/event.entity';
import { Progress } from './progress/entities/progress.entity';
import { Connection } from './connections/entities/connection.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'tutorplus.db',
      entities: [User, Task, Message, FileEntity, Transaction, Event, Progress, Connection],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    TasksModule,
    MessagesModule,
    FilesModule,
    FinanceModule,
    CalendarModule,
    ProgressModule,
    ConnectionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}


import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TasksModule } from "./tasks/tasks.module";
import { MessagesModule } from "./messages/messages.module";
import { FilesModule } from "./files/files.module";
import { FinanceModule } from "./finance/finance.module";
import { CalendarModule } from "./calendar/calendar.module";
import { ProgressModule } from "./progress/progress.module";
import { ConnectionsModule } from "./connections/connections.module";
import { HomeworkModule } from "./homework/homework.module";
import { SubjectsModule } from "./subjects/subjects.module";
import { AppController } from "./app.controller";
import { User } from "./users/entities/user.entity";
import { Task } from "./tasks/entities/task.entity";
import { Message } from "./messages/entities/message.entity";
import { FileEntity } from "./files/entities/file.entity";
import { FolderEntity } from "./files/entities/folder.entity";
import { Transaction } from "./finance/entities/transaction.entity";
import { Event } from "./calendar/entities/event.entity";
import { Progress } from "./progress/entities/progress.entity";
import { Connection } from "./connections/entities/connection.entity";
import { Homework } from "./homework/entities/homework.entity";
import { Subject } from "./subjects/entities/subject.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("DB_HOST", "localhost"),
        port: parseInt(config.get<string>("DB_PORT", "5432"), 10),
        username: config.get<string>("DB_USER", "postgres"),
        password: config.get<string>("DB_PASSWORD", "postgres"),
        database: config.get<string>("DB_NAME", "tutorplus"),
        entities: [
          User,
          Task,
          Message,
          FileEntity,
          FolderEntity,
          Transaction,
          Event,
          Progress,
          Connection,
          Homework,
          Subject,
        ],
        synchronize: true,
      }),
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
    HomeworkModule,
    SubjectsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

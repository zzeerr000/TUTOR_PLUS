import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConnectionsController } from "./connections.controller";
import { ConnectionsService } from "./connections.service";
import { Connection } from "./entities/connection.entity";
import { UsersModule } from "../users/users.module";
import { CalendarModule } from "../calendar/calendar.module";
import { HomeworkModule } from "../homework/homework.module";
import { SubjectsModule } from "../subjects/subjects.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Connection]),
    forwardRef(() => UsersModule),
    forwardRef(() => CalendarModule),
    forwardRef(() => SubjectsModule),
    HomeworkModule,
  ],
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService],
})
export class ConnectionsModule {}

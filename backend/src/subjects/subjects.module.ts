import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubjectsController } from "./subjects.controller";
import { SubjectsService } from "./subjects.service";
import { Subject } from "./entities/subject.entity";
import { FilesModule } from "../files/files.module";
import { UsersModule } from "../users/users.module";
import { ConnectionsModule } from "../connections/connections.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject]),
    forwardRef(() => FilesModule),
    forwardRef(() => UsersModule),
    forwardRef(() => ConnectionsModule),
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}

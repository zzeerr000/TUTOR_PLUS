import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";
import { FileEntity } from "./entities/file.entity";
import { FolderEntity } from "./entities/folder.entity";
import { Homework } from "../homework/entities/homework.entity";
import { ConnectionsModule } from "../connections/connections.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity, FolderEntity, Homework]),
    forwardRef(() => ConnectionsModule),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

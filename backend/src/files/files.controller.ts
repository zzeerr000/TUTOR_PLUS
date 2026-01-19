import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FilesService } from "./files.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Response } from "express";

@Controller("files")
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  findAll(@Request() req) {
    return this.filesService.findAll(req.user.sub, req.user.role);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req
  ) {
    return this.filesService.uploadFile(file, {
      ...body,
      uploadedById: req.user.sub,
    });
  }

  @Get("download/:id")
  async downloadFile(
    @Param("id") id: string,
    @Res() res: Response,
    @Request() req
  ) {
    const file = await this.filesService.getFileForDownload(
      +id,
      req.user.sub,
      req.user.role
    );
    return res.download(file.path, file.name);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.filesService.remove(+id);
  }

  @Get("storage")
  getStorageStats(@Request() req) {
    return this.filesService.getStorageStats(req.user.sub, req.user.role);
  }
}

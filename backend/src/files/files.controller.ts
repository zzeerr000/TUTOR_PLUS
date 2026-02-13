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
  findAll(@Request() req, @Param("folderId") folderId?: string) {
    return this.filesService.findAll(req.user.sub, req.user.role, folderId ? +folderId : null);
  }

  @Get("folder/:folderId")
  findInFolder(@Request() req, @Param("folderId") folderId: string) {
    return this.filesService.findAll(req.user.sub, req.user.role, +folderId);
  }

  @Post("folders")
  createFolder(@Body() body: { name: string, parentId?: number }, @Request() req) {
    return this.filesService.createFolder(body.name, req.user.sub, body.parentId);
  }

  @Delete("folders/:id")
  removeFolder(@Param("id") id: string, @Request() req) {
    return this.filesService.removeFolder(+id, req.user.sub);
  }

  @Post(":id/move")
  moveFile(@Param("id") id: string, @Body() body: { folderId: number | null }, @Request() req) {
    return this.filesService.moveFile(+id, body.folderId, req.user.sub);
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

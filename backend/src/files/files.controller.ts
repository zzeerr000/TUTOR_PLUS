import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  findAll(@Request() req) {
    return this.filesService.findAll(req.user.sub, req.user.role);
  }

  @Post()
  create(@Body() createFileDto: any, @Request() req) {
    return this.filesService.create({
      ...createFileDto,
      uploadedById: req.user.sub,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.filesService.remove(+id);
  }

  @Get('storage')
  getStorageStats(@Request() req) {
    return this.filesService.getStorageStats(req.user.sub, req.user.role);
  }
}


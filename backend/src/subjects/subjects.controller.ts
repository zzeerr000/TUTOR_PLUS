import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from "@nestjs/common";
import { SubjectsService } from "./subjects.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("subjects")
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {
    console.log("SubjectsController initialized");
  }

  @Post()
  create(
    @Body() createSubjectDto: { name: string; color?: string },
    @Request() req,
  ) {
    return this.subjectsService.create(req.user.sub, createSubjectDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.subjectsService.findAll(req.user.sub, req.user.role);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateSubjectDto: { name?: string; color?: string },
  ) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.subjectsService.remove(id);
  }
}

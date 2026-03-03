import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { ConnectionsService } from "./connections.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("connections")
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post("request")
  createRequest(@Body() body: { code: string }, @Request() req) {
    return this.connectionsService.createConnectionRequest(
      req.user.sub,
      body.code,
    );
  }

  @Get("pending")
  getPendingRequests(@Request() req) {
    return this.connectionsService.getPendingRequests(
      req.user.sub,
      req.user.role,
    );
  }

  @Get()
  getConnections(@Request() req) {
    return this.connectionsService.getConnections(req.user.sub, req.user.role);
  }

  @Post(":id/subjects")
  updateSubjects(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { subjectIds: number[] },
    @Request() req,
  ) {
    return this.connectionsService.updateSubjects(
      id,
      req.user.sub,
      body.subjectIds,
    );
  }

  @Post(":id/approve")
  approveConnection(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: { existingStudentId?: number },
    @Request() req,
  ) {
    return this.connectionsService.approveConnection(
      id,
      req.user.sub,
      body.existingStudentId,
    );
  }

  @Post("manual")
  createManualStudent(
    @Body()
    body: {
      name: string;
      defaultSubject?: string;
      defaultPrice?: number;
      defaultDuration?: number;
      subjectIds?: number[];
    },
    @Request() req,
  ) {
    return this.connectionsService.createManualStudent(
      req.user.sub,
      body.name,
      body.defaultSubject,
      body.defaultPrice,
      body.defaultDuration,
      body.subjectIds,
    );
  }

  @Post("link-virtual")
  linkVirtualStudent(
    @Body() body: { virtualStudentId: number; studentCode: string },
    @Request() req,
  ) {
    return this.connectionsService.linkVirtualStudentByCode(
      req.user.sub,
      body.virtualStudentId,
      body.studentCode,
    );
  }

  @Post(":studentId/alias")
  updateAlias(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Body()
    body: {
      alias?: string;
      defaultSubject?: string;
      defaultPrice?: number;
      defaultDuration?: number;
      subjectIds?: number[];
    },
    @Request() req,
  ) {
    return this.connectionsService.updateStudentAlias(
      req.user.sub,
      studentId,
      body,
    );
  }

  @Post(":id/reject")
  rejectConnection(@Param("id", ParseIntPipe) id: number, @Request() req) {
    return this.connectionsService.rejectConnection(id, req.user.sub);
  }

  @Delete(":id")
  deleteConnection(
    @Param("id", ParseIntPipe) id: number, 
    @Request() req,
    @Query('deleteData') deleteData?: boolean
  ) {
    return this.connectionsService.deleteConnection(id, req.user.sub, deleteData);
  }

  @Post(":studentId/delete")
  removeStudent(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Request() req,
  ) {
    return this.connectionsService.removeStudent(req.user.sub, studentId);
  }

  @Get(":studentId/stats")
  getStudentStats(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Request() req,
  ) {
    return this.connectionsService.getStudentStats(req.user.sub, studentId);
  }
}

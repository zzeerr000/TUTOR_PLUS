import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('request')
  createRequest(@Body() body: { code: string }, @Request() req) {
    return this.connectionsService.createConnectionRequest(req.user.sub, body.code);
  }

  @Get('pending')
  getPendingRequests(@Request() req) {
    return this.connectionsService.getPendingRequests(req.user.sub, req.user.role);
  }

  @Get()
  getConnections(@Request() req) {
    return this.connectionsService.getConnections(req.user.sub, req.user.role);
  }

  @Post(':id/approve')
  approveConnection(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.connectionsService.approveConnection(id, req.user.sub);
  }

  @Post(':id/reject')
  rejectConnection(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.connectionsService.rejectConnection(id, req.user.sub);
  }
}


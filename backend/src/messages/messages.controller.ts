import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.sub, req.user.role);
  }

  @Get('conversation/:otherUserId')
  getMessages(@Request() req, @Param('otherUserId') otherUserId: string) {
    return this.messagesService.getMessages(req.user.sub, +otherUserId, req.user.role);
  }

  @Post()
  create(@Body() createMessageDto: any, @Request() req) {
    return this.messagesService.create({
      ...createMessageDto,
      senderId: req.user.sub,
    }, req.user.role);
  }

  @Post(':senderId/read')
  markAsRead(@Request() req, @Param('senderId') senderId: string) {
    return this.messagesService.markAsRead(req.user.sub, +senderId);
  }
}


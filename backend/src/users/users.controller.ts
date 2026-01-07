import { Controller, Get, Post, Put, Delete, Body, UseGuards, Request, ForbiddenException, Inject, forwardRef, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConnectionsService } from '../connections/connections.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ConnectionsService))
    private readonly connectionsService: ConnectionsService,
  ) {}

  @Get('code')
  async getCode(@Request() req) {
    return { code: await this.usersService.getOrGenerateCode(req.user.sub) };
  }

  @Get('students')
  async getStudents(@Request() req) {
    if (req.user.role !== 'tutor') {
      return [];
    }
    // Return only connected students
    const connections = await this.connectionsService.getConnections(req.user.sub, req.user.role);
    return connections.map(c => c.student);
  }

  @Post('students')
  async createStudent(@Body() createStudentDto: { email: string; password: string; name: string }, @Request() req) {
    if (req.user.role !== 'tutor') {
      throw new ForbiddenException('Only tutors can create students');
    }
    return this.usersService.create(createStudentDto.email, createStudentDto.password, createStudentDto.name, 'student');
  }

  @Put('profile/name')
  async updateName(@Body() body: { name: string }, @Request() req) {
    return this.usersService.updateName(req.user.sub, body.name);
  }

  @Delete('profile')
  async deleteAccount(@Request() req) {
    await this.usersService.deleteAccount(req.user.sub);
    return { message: 'Account deleted successfully' };
  }
}


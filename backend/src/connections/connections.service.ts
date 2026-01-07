import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection, ConnectionStatus } from './entities/connection.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection)
    private connectionsRepository: Repository<Connection>,
    private usersService: UsersService,
  ) {}

  async createConnectionRequest(requestedById: number, code: string): Promise<Connection> {
    const requester = await this.usersService.findById(requestedById);
    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    const targetUser = await this.usersService.findByCode(code);
    if (!targetUser) {
      throw new NotFoundException('User with this code not found');
    }

    if (targetUser.id === requestedById) {
      throw new BadRequestException('Cannot connect to yourself');
    }

    // Check if roles are compatible
    if (requester.role === targetUser.role) {
      throw new BadRequestException('Cannot connect to user with same role');
    }

    // Determine tutor and student
    const tutorId = requester.role === 'tutor' ? requester.id : targetUser.id;
    const studentId = requester.role === 'student' ? requester.id : targetUser.id;

    // Check if connection already exists
    const existing = await this.connectionsRepository.findOne({
      where: { tutorId, studentId },
    });

    if (existing) {
      if (existing.status === ConnectionStatus.APPROVED) {
        throw new BadRequestException('Connection already exists');
      }
      if (existing.status === ConnectionStatus.PENDING) {
        throw new BadRequestException('Connection request already pending');
      }
      // If rejected, create a new request
      existing.status = ConnectionStatus.PENDING;
      existing.requestedById = requestedById;
      return this.connectionsRepository.save(existing);
    }

    const connection = this.connectionsRepository.create({
      tutorId,
      studentId,
      status: ConnectionStatus.PENDING,
      requestedById,
    });

    return this.connectionsRepository.save(connection);
  }

  async getPendingRequests(userId: number, userRole: string): Promise<Connection[]> {
    if (userRole === 'tutor') {
      // Only return requests where tutor is the recipient (not the requester)
      return this.connectionsRepository
        .createQueryBuilder('connection')
        .leftJoinAndSelect('connection.student', 'student')
        .where('connection.tutorId = :tutorId', { tutorId: userId })
        .andWhere('connection.status = :status', { status: ConnectionStatus.PENDING })
        .andWhere('connection.requestedById != :userId', { userId })
        .orderBy('connection.createdAt', 'DESC')
        .getMany();
    } else {
      // Only return requests where student is the recipient (not the requester)
      return this.connectionsRepository
        .createQueryBuilder('connection')
        .leftJoinAndSelect('connection.tutor', 'tutor')
        .where('connection.studentId = :studentId', { studentId: userId })
        .andWhere('connection.status = :status', { status: ConnectionStatus.PENDING })
        .andWhere('connection.requestedById != :userId', { userId })
        .orderBy('connection.createdAt', 'DESC')
        .getMany();
    }
  }

  async approveConnection(connectionId: number, userId: number): Promise<Connection> {
    const connection = await this.connectionsRepository.findOne({
      where: { id: connectionId },
      relations: ['tutor', 'student'],
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Verify user is the recipient (not the requester)
    const isRecipient = 
      (connection.tutorId === userId && connection.requestedById !== userId) ||
      (connection.studentId === userId && connection.requestedById !== userId);

    if (!isRecipient) {
      throw new BadRequestException('You cannot approve this request');
    }

    connection.status = ConnectionStatus.APPROVED;
    return this.connectionsRepository.save(connection);
  }

  async rejectConnection(connectionId: number, userId: number): Promise<void> {
    const connection = await this.connectionsRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Verify user is the recipient
    const isRecipient = 
      (connection.tutorId === userId && connection.requestedById !== userId) ||
      (connection.studentId === userId && connection.requestedById !== userId);

    if (!isRecipient) {
      throw new BadRequestException('You cannot reject this request');
    }

    connection.status = ConnectionStatus.REJECTED;
    await this.connectionsRepository.save(connection);
  }

  async getConnections(userId: number, userRole: string): Promise<Connection[]> {
    if (userRole === 'tutor') {
      return this.connectionsRepository.find({
        where: { tutorId: userId, status: ConnectionStatus.APPROVED },
        relations: ['student'],
        order: { createdAt: 'DESC' },
      });
    } else {
      return this.connectionsRepository.find({
        where: { studentId: userId, status: ConnectionStatus.APPROVED },
        relations: ['tutor'],
        order: { createdAt: 'DESC' },
      });
    }
  }
}


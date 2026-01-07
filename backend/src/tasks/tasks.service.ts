import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { ConnectionsService } from '../connections/connections.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionsService: ConnectionsService,
  ) {}

  async create(createTaskDto: any): Promise<Task> {
    // If assigned to a student, verify connection
    if (createTaskDto.assignedToId && createTaskDto.userId) {
      const connections = await this.connectionsService.getConnections(createTaskDto.userId, 'tutor');
      const isConnected = connections.some(c => c.studentId === createTaskDto.assignedToId);
      if (!isConnected) {
        throw new BadRequestException('Can only assign tasks to connected students');
      }
    }
    
    const task = this.tasksRepository.create(createTaskDto);
    const saved = await this.tasksRepository.save(task);
    if (Array.isArray(saved)) {
      return saved[0];
    }
    return saved;
  }

  async findAll(userId: number, userRole: string): Promise<Task[]> {
    if (userRole === 'tutor') {
      // Get connected students
      const connections = await this.connectionsService.getConnections(userId, 'tutor');
      const connectedStudentIds = connections.map(c => c.studentId);
      
      if (connectedStudentIds.length === 0) {
        return [];
      }

      return this.tasksRepository
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.user', 'user')
        .leftJoinAndSelect('task.assignedTo', 'assignedTo')
        .where('task.userId = :userId', { userId })
        .orWhere('task.assignedToId IN (:...studentIds)', { studentIds: connectedStudentIds })
        .orderBy('task.createdAt', 'DESC')
        .getMany();
    } else {
      // Get connected tutors
      const connections = await this.connectionsService.getConnections(userId, 'student');
      const connectedTutorIds = connections.map(c => c.tutorId);
      
      if (connectedTutorIds.length === 0) {
        return [];
      }

      return this.tasksRepository
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.user', 'user')
        .leftJoinAndSelect('task.assignedTo', 'assignedTo')
        .where('task.assignedToId = :userId', { userId })
        .orWhere('(task.userId IN (:...tutorIds) AND task.assignedToId = :userId)', { tutorIds: connectedTutorIds, userId })
        .orderBy('task.createdAt', 'DESC')
        .getMany();
    }
  }

  async update(id: number, updateTaskDto: any): Promise<Task> {
    await this.tasksRepository.update(id, updateTaskDto);
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new Error('Task not found');
    }
    return task;
  }

  async remove(id: number): Promise<void> {
    await this.tasksRepository.delete(id);
  }
}


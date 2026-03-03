import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { ConnectionsService } from '../connections/connections.service';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionsService: ConnectionsService,
  ) {}

  async create(createProgressDto: any): Promise<Progress> {
    // Verify connection exists
    const connections = await this.connectionsService.getConnections(createProgressDto.tutorId, 'tutor');
    const isConnected = connections.some(c => c.studentId === createProgressDto.studentId);
    if (!isConnected) {
      throw new BadRequestException('Can only track progress for connected students');
    }
    
    const progress = this.progressRepository.create(createProgressDto);
    const saved = await this.progressRepository.save(progress);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(userId: number, userRole: string) {
    if (userRole === 'tutor') {
      // Get connected students
      const connections = await this.connectionsService.getConnections(userId, 'tutor');
      const connectedStudentIds = connections.map(c => c.studentId);
      
      if (connectedStudentIds.length === 0) {
        return [];
      }

      return this.progressRepository
        .createQueryBuilder('progress')
        .leftJoinAndSelect('progress.student', 'student')
        .where('progress.tutorId = :tutorId', { tutorId: userId })
        .andWhere('progress.studentId IN (:...studentIds)', { studentIds: connectedStudentIds })
        .orderBy('progress.createdAt', 'DESC')
        .getMany();
    } else {
      // Get connected tutors
      const connections = await this.connectionsService.getConnections(userId, 'student');
      const connectedTutorIds = connections.map(c => c.tutorId);
      
      if (connectedTutorIds.length === 0) {
        return [];
      }

      return this.progressRepository
        .createQueryBuilder('progress')
        .leftJoinAndSelect('progress.tutor', 'tutor')
        .where('progress.studentId = :studentId', { studentId: userId })
        .andWhere('progress.tutorId IN (:...tutorIds)', { tutorIds: connectedTutorIds })
        .orderBy('progress.createdAt', 'DESC')
        .getMany();
    }
  }

  async getOverallStats(userId: number, userRole: string) {
    const progress = await this.findAll(userId, userRole);
    if (progress.length === 0) {
      return { overallProgress: 0, totalHours: 0 };
    }
    const overallProgress = progress.reduce((sum, p) => sum + Number(p.progress), 0) / progress.length;
    const totalHours = progress.reduce((sum, p) => sum + Number(p.hoursStudied), 0);
    return { overallProgress: Math.round(overallProgress), totalHours: Math.round(totalHours) };
  }
}


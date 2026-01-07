import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { ConnectionsService } from '../connections/connections.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private filesRepository: Repository<FileEntity>,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionsService: ConnectionsService,
  ) {}

  async create(createFileDto: any): Promise<FileEntity> {
    // If assigned to a student, verify connection
    if (createFileDto.assignedToId) {
      const connections = await this.connectionsService.getConnections(createFileDto.uploadedById, 'tutor');
      const isConnected = connections.some(c => c.studentId === createFileDto.assignedToId);
      if (!isConnected) {
        throw new BadRequestException('Can only assign files to connected students');
      }
    }
    
    const file = this.filesRepository.create(createFileDto);
    const saved = await this.filesRepository.save(file);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(userId: number, userRole: string): Promise<FileEntity[]> {
    if (userRole === 'tutor') {
      // Get connected students
      const connections = await this.connectionsService.getConnections(userId, 'tutor');
      const connectedStudentIds = connections.map(c => c.studentId);
      
      if (connectedStudentIds.length === 0) {
        return [];
      }

      return this.filesRepository
        .createQueryBuilder('file')
        .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
        .leftJoinAndSelect('file.assignedTo', 'assignedTo')
        .where('file.uploadedById = :userId', { userId })
        .andWhere('(file.assignedToId IN (:...studentIds) OR file.assignedToId IS NULL)', { studentIds: connectedStudentIds })
        .orderBy('file.createdAt', 'DESC')
        .getMany();
    } else {
      // Get connected tutors
      const connections = await this.connectionsService.getConnections(userId, 'student');
      const connectedTutorIds = connections.map(c => c.tutorId);
      
      if (connectedTutorIds.length === 0) {
        return [];
      }

      return this.filesRepository
        .createQueryBuilder('file')
        .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
        .leftJoinAndSelect('file.assignedTo', 'assignedTo')
        .where('file.assignedToId = :userId', { userId })
        .orWhere('(file.assignedToId IS NULL AND file.uploadedById IN (:...tutorIds))', { tutorIds: connectedTutorIds })
        .orderBy('file.createdAt', 'DESC')
        .getMany();
    }
  }

  async remove(id: number): Promise<void> {
    await this.filesRepository.delete(id);
  }

  async getStorageStats(userId: number, userRole: string): Promise<{ used: number; total: number; usedFormatted: string; totalFormatted: string }> {
    const files = await this.findAll(userId, userRole);
    
    // Parse file sizes and sum them up
    let totalBytes = 0;
    files.forEach(file => {
      const sizeStr = file.size || '0 B';
      const sizeMatch = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
      if (sizeMatch) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();
        switch (unit) {
          case 'GB':
            totalBytes += value * 1024 * 1024 * 1024;
            break;
          case 'MB':
            totalBytes += value * 1024 * 1024;
            break;
          case 'KB':
            totalBytes += value * 1024;
            break;
          default:
            totalBytes += value;
        }
      }
    });
    
    const totalGB = 5; // 5 GB limit
    const totalBytesLimit = totalGB * 1024 * 1024 * 1024;
    
    const formatBytes = (bytes: number): string => {
      if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      } else if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      } else if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
      }
      return `${bytes} B`;
    };
    
    return {
      used: totalBytes,
      total: totalBytesLimit,
      usedFormatted: formatBytes(totalBytes),
      totalFormatted: `${totalGB} GB`,
    };
  }
}


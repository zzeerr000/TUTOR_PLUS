import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { ConnectionsService } from '../connections/connections.service';
import { FinanceService } from '../finance/finance.service';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    private connectionsService: ConnectionsService,
    @Inject(forwardRef(() => FinanceService))
    private financeService: FinanceService,
  ) {}

  async verifyConnection(tutorId: number, studentId: number): Promise<void> {
    const connections = await this.connectionsService.getConnections(tutorId, 'tutor');
    const isConnected = connections.some(c => c.studentId === studentId);
    if (!isConnected) {
      throw new BadRequestException('Tutor and student must be connected to schedule lessons');
    }
  }

  async create(createEventDto: any): Promise<Event> {
    const event = this.eventsRepository.create(createEventDto);
    const saved = await this.eventsRepository.save(event);
    const savedEvent = Array.isArray(saved) ? saved[0] : saved;
    
    // Create pending transaction for this lesson
    try {
      const transaction = await this.financeService.create({
        amount: 0, // Default amount, can be updated later
        status: 'pending',
        subject: createEventDto.subject || createEventDto.title,
        tutorId: createEventDto.tutorId,
        studentId: createEventDto.studentId,
        dueDate: new Date(createEventDto.date),
      });
      
      // Link transaction to event
      savedEvent.transactionId = transaction.id;
      savedEvent.paymentPending = true;
      await this.eventsRepository.save(savedEvent);
    } catch (error) {
      // If transaction creation fails, still return the event
      console.error('Failed to create transaction for event:', error);
    }
    
    return savedEvent;
  }

  async findAll(userId: number, userRole: string) {
    // Get connected users
    const connections = await this.connectionsService.getConnections(userId, userRole);
    const connectedUserIds = connections.map(c => 
      userRole === 'tutor' ? c.studentId : c.tutorId
    );

    if (connectedUserIds.length === 0) {
      return [];
    }

    if (userRole === 'tutor') {
      return this.eventsRepository
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.student', 'student')
        .where('event.tutorId = :tutorId', { tutorId: userId })
        .andWhere('event.studentId IN (:...studentIds)', { studentIds: connectedUserIds })
        .orderBy('event.date', 'ASC')
        .addOrderBy('event.time', 'ASC')
        .getMany();
    } else {
      return this.eventsRepository
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.tutor', 'tutor')
        .where('event.studentId = :studentId', { studentId: userId })
        .andWhere('event.tutorId IN (:...tutorIds)', { tutorIds: connectedUserIds })
        .orderBy('event.date', 'ASC')
        .addOrderBy('event.time', 'ASC')
        .getMany();
    }
  }

  async findOne(id: number): Promise<Event | null> {
    return this.eventsRepository.findOne({ 
      where: { id },
      relations: ['student', 'tutor'],
    });
  }

  async updatePaymentStatus(transactionId: number, status: boolean): Promise<void> {
    await this.eventsRepository.update(
      { transactionId },
      { paymentPending: status }
    );
  }

  async update(id: number, updateEventDto: any): Promise<Event> {
    await this.eventsRepository.update(id, updateEventDto);
    const updated = await this.eventsRepository.findOne({ 
      where: { id },
      relations: ['student', 'tutor'],
    });
    if (!updated) {
      throw new Error('Event not found');
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    await this.eventsRepository.delete(id);
  }
}


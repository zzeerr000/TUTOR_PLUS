import { Injectable, Inject, forwardRef, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Event } from '../calendar/entities/event.entity';
import { ConnectionsService } from '../connections/connections.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionsService: ConnectionsService,
  ) {}

  async create(createTransactionDto: any): Promise<Transaction> {
    // Verify connection exists
    const connections = await this.connectionsService.getConnections(createTransactionDto.tutorId, 'tutor');
    const isConnected = connections.some(c => c.studentId === createTransactionDto.studentId);
    if (!isConnected) {
      throw new BadRequestException('Can only create transactions with connected students');
    }
    
    const transaction = this.transactionsRepository.create(createTransactionDto);
    const saved = await this.transactionsRepository.save(transaction);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(userId: number, userRole: string) {
    // Check and create transactions for past events before returning
    await this.checkAndCreateTransactionsForPastEvents();
    
    if (userRole === 'tutor') {
      // Get connected students
      const connections = await this.connectionsService.getConnections(userId, 'tutor');
      const connectedStudentIds = connections.map(c => c.studentId);
      
      if (connectedStudentIds.length === 0) {
        return [];
      }

      return this.transactionsRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.student', 'student')
        .where('transaction.tutorId = :tutorId', { tutorId: userId })
        .andWhere('transaction.studentId IN (:...studentIds)', { studentIds: connectedStudentIds })
        .orderBy('transaction.createdAt', 'DESC')
        .getMany();
    } else {
      // Get connected tutors
      const connections = await this.connectionsService.getConnections(userId, 'student');
      const connectedTutorIds = connections.map(c => c.tutorId);
      
      if (connectedTutorIds.length === 0) {
        return [];
      }

      return this.transactionsRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.tutor', 'tutor')
        .where('transaction.studentId = :studentId', { studentId: userId })
        .andWhere('transaction.tutorId IN (:...tutorIds)', { tutorIds: connectedTutorIds })
        .orderBy('transaction.createdAt', 'DESC')
        .getMany();
    }
  }

  async checkAndCreateTransactionsForPastEvents(): Promise<void> {
    // Get all events without transactions that have passed
    const now = new Date();
    const events = await this.eventsRepository.find({
      where: {
        transactionId: IsNull(),
      },
      relations: ['student', 'tutor'],
    });

    for (const event of events) {
      // Parse event date and time
      const eventDate = new Date(event.date);
      const timeStr = event.time;
      
      // Convert 12-hour format to 24-hour
      let hour24 = 0;
      let minute = 0;
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        const [timePart, period] = timeStr.split(' ');
        const [hours, minutes] = timePart.split(':');
        hour24 = parseInt(hours);
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        minute = parseInt(minutes);
      } else {
        const [hours, minutes] = timeStr.split(':');
        hour24 = parseInt(hours);
        minute = parseInt(minutes);
      }
      
      eventDate.setHours(hour24, minute, 0, 0);
      
      // Check if event has passed (assuming 1 hour duration)
      const eventEndTime = new Date(eventDate);
      eventEndTime.setHours(eventEndTime.getHours() + 1);
      
      if (eventEndTime < now && !event.transactionId) {
        // Verify connection exists
        const connections = await this.connectionsService.getConnections(event.tutorId, 'tutor');
        const isConnected = connections.some(c => c.studentId === event.studentId);
        if (!isConnected) {
          continue;
        }
        
        // Create pending transaction for this past event
        try {
          const transaction = await this.create({
            amount: 0, // Default amount, can be updated later
            status: 'pending',
            subject: event.subject || event.title,
            tutorId: event.tutorId,
            studentId: event.studentId,
            dueDate: eventDate,
          });
          
          // Link transaction to event
          event.transactionId = transaction.id;
          event.paymentPending = true;
          await this.eventsRepository.save(event);
        } catch (error) {
          console.error('Failed to create transaction for past event:', error);
        }
      }
    }
  }

  async confirmPayment(transactionId: number, tutorId: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({ 
      where: { id: transactionId },
      relations: ['tutor', 'student'],
    });
    
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }
    
    if (transaction.tutorId !== tutorId) {
      throw new ForbiddenException('You can only confirm payments for your own transactions');
    }
    
    transaction.status = 'completed';
    const updated = await this.transactionsRepository.save(transaction);
    
    // Update event payment status
    await this.eventsRepository.update(
      { transactionId: transactionId },
      { paymentPending: false }
    );
    
    return updated;
  }

  async getStats(userId: number, userRole: string) {
    const transactions = await this.findAll(userId, userRole);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    const thisMonthTransactions = transactions.filter(
      t => new Date(t.createdAt) >= thisMonth && t.status === 'completed'
    );
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthTransactions = transactions.filter(
      t => new Date(t.createdAt) >= lastMonth && new Date(t.createdAt) < thisMonth && t.status === 'completed'
    );

    const thisMonthTotal = thisMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const pending = transactions.filter(t => t.status === 'pending');
    const pendingTotal = pending.reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      pending: pendingTotal,
      pendingCount: pending.length,
    };
  }
}


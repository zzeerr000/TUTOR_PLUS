import { Injectable, Inject, forwardRef, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { ConnectionsService } from '../connections/connections.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
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
    // Note: This requires importing CalendarService, but to avoid circular dependency,
    // we'll handle this in the controller or use an event emitter
    
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


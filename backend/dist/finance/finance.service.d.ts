import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { ConnectionsService } from '../connections/connections.service';
export declare class FinanceService {
    private transactionsRepository;
    private connectionsService;
    constructor(transactionsRepository: Repository<Transaction>, connectionsService: ConnectionsService);
    create(createTransactionDto: any): Promise<Transaction>;
    findAll(userId: number, userRole: string): Promise<Transaction[]>;
    confirmPayment(transactionId: number, tutorId: number): Promise<Transaction>;
    getStats(userId: number, userRole: string): Promise<{
        thisMonth: number;
        lastMonth: number;
        pending: number;
        pendingCount: number;
    }>;
}

import { Repository } from "typeorm";
import { Transaction } from "./entities/transaction.entity";
import { Event } from "../calendar/entities/event.entity";
import { ConnectionsService } from "../connections/connections.service";
import { Homework } from "../homework/entities/homework.entity";
export declare class FinanceService {
    private transactionsRepository;
    private eventsRepository;
    private homeworkRepository;
    private connectionsService;
    constructor(transactionsRepository: Repository<Transaction>, eventsRepository: Repository<Event>, homeworkRepository: Repository<Homework>, connectionsService: ConnectionsService);
    private getEventStartUtc;
    create(createTransactionDto: any): Promise<Transaction>;
    findAll(userId: number, userRole: string): Promise<Transaction[]>;
    checkAndCreateTransactionsForPastEvents(): Promise<void>;
    confirmPayment(transactionId: number, tutorId: number): Promise<Transaction>;
    cancelPayment(transactionId: number, tutorId: number): Promise<void>;
    getStats(userId: number, userRole: string): Promise<{
        thisMonth: number;
        lastMonth: number;
        pending: number;
        pendingCount: number;
    }>;
    deletePendingTransaction(transactionId: number): Promise<void>;
    deleteAllForTutor(tutorId: number): Promise<{
        deletedCount: number;
    }>;
}

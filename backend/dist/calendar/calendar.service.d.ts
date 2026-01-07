import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { ConnectionsService } from '../connections/connections.service';
import { FinanceService } from '../finance/finance.service';
export declare class CalendarService {
    private eventsRepository;
    private connectionsService;
    private financeService;
    constructor(eventsRepository: Repository<Event>, connectionsService: ConnectionsService, financeService: FinanceService);
    verifyConnection(tutorId: number, studentId: number): Promise<void>;
    create(createEventDto: any): Promise<Event>;
    findAll(userId: number, userRole: string): Promise<Event[]>;
    findOne(id: number): Promise<Event | null>;
    updatePaymentStatus(transactionId: number, status: boolean): Promise<void>;
    update(id: number, updateEventDto: any): Promise<Event>;
    remove(id: number): Promise<void>;
}

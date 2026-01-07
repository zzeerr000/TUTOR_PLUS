import { CalendarService } from './calendar.service';
import { FinanceService } from '../finance/finance.service';
export declare class CalendarController {
    private readonly calendarService;
    private readonly financeService;
    constructor(calendarService: CalendarService, financeService: FinanceService);
    findAll(req: any): Promise<import("./entities/event.entity").Event[]>;
    create(createEventDto: any, req: any): Promise<import("./entities/event.entity").Event>;
    update(id: number, updateEventDto: any, req: any): Promise<import("./entities/event.entity").Event>;
    remove(id: string, req: any): Promise<void>;
}

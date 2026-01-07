import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    findAll(req: any): Promise<import("./entities/transaction.entity").Transaction[]>;
    getStats(req: any): Promise<{
        thisMonth: number;
        lastMonth: number;
        pending: number;
        pendingCount: number;
    }>;
    create(createTransactionDto: any, req: any): Promise<import("./entities/transaction.entity").Transaction>;
    confirmPayment(id: number, req: any): Promise<import("./entities/transaction.entity").Transaction>;
}

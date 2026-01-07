import { ProgressService } from './progress.service';
export declare class ProgressController {
    private readonly progressService;
    constructor(progressService: ProgressService);
    findAll(req: any): Promise<import("./entities/progress.entity").Progress[]>;
    getStats(req: any): Promise<{
        overallProgress: number;
        totalHours: number;
    }>;
    create(createProgressDto: any, req: any): Promise<import("./entities/progress.entity").Progress>;
}

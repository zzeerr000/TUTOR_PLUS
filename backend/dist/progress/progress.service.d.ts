import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';
import { ConnectionsService } from '../connections/connections.service';
export declare class ProgressService {
    private progressRepository;
    private connectionsService;
    constructor(progressRepository: Repository<Progress>, connectionsService: ConnectionsService);
    create(createProgressDto: any): Promise<Progress>;
    findAll(userId: number, userRole: string): Promise<Progress[]>;
    getOverallStats(userId: number, userRole: string): Promise<{
        overallProgress: number;
        totalHours: number;
    }>;
}

import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { ConnectionsService } from '../connections/connections.service';
export declare class FilesService {
    private filesRepository;
    private connectionsService;
    private readonly uploadPath;
    constructor(filesRepository: Repository<FileEntity>, connectionsService: ConnectionsService);
    uploadFile(file: Express.Multer.File, data: any): Promise<FileEntity>;
    getFileForDownload(id: number, userId: number, userRole: string): Promise<FileEntity>;
    findAll(userId: number, userRole: string): Promise<FileEntity[]>;
    remove(id: number): Promise<void>;
    getStorageStats(userId: number, userRole: string): Promise<{
        used: number;
        total: number;
        usedFormatted: string;
        totalFormatted: string;
    }>;
}

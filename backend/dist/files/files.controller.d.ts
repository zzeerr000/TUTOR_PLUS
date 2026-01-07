import { FilesService } from './files.service';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    findAll(req: any): Promise<import("./entities/file.entity").FileEntity[]>;
    create(createFileDto: any, req: any): Promise<import("./entities/file.entity").FileEntity>;
    remove(id: string): Promise<void>;
    getStorageStats(req: any): Promise<{
        used: number;
        total: number;
        usedFormatted: string;
        totalFormatted: string;
    }>;
}

import { FilesService } from "./files.service";
import { Response } from "express";
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    findAll(req: any): Promise<import("./entities/file.entity").FileEntity[]>;
    uploadFile(file: Express.Multer.File, body: any, req: any): Promise<import("./entities/file.entity").FileEntity>;
    downloadFile(id: string, res: Response, req: any): Promise<void>;
    remove(id: string): Promise<void>;
    getStorageStats(req: any): Promise<{
        used: number;
        total: number;
        usedFormatted: string;
        totalFormatted: string;
    }>;
}

import { Repository } from "typeorm";
import { FileEntity } from "./entities/file.entity";
import { FolderEntity } from "./entities/folder.entity";
import { Homework } from "../homework/entities/homework.entity";
import { ConnectionsService } from "../connections/connections.service";
export declare class FilesService {
    private filesRepository;
    private foldersRepository;
    private homeworkRepository;
    private connectionsService;
    private readonly uploadPath;
    constructor(filesRepository: Repository<FileEntity>, foldersRepository: Repository<FolderEntity>, homeworkRepository: Repository<Homework>, connectionsService: ConnectionsService);
    uploadFile(file: Express.Multer.File, data: any): Promise<FileEntity>;
    getFileForDownload(id: number, userId: number, userRole: string): Promise<FileEntity>;
    findAll(userId: number, userRole: string, folderId?: number | null): Promise<{
        files: FileEntity[];
        folders: FolderEntity[];
    }>;
    createFolder(name: string, uploadedById: number, parentId?: number | null): Promise<FolderEntity>;
    removeFolder(id: number, userId: number): Promise<void>;
    private deleteFolderContents;
    moveFile(fileId: number, folderId: number | null, userId: number): Promise<FileEntity>;
    remove(id: number): Promise<void>;
    getStorageStats(userId: number, userRole: string): Promise<{
        used: number;
        total: number;
        usedFormatted: string;
        totalFormatted: string;
    }>;
}

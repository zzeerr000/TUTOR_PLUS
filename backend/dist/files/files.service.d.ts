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
    findAll(userId: number, userRole: string, folderId?: number | null, filterSubjectId?: number | null): Promise<{
        files: FileEntity[];
        folders: any[];
    }>;
    createFolder(name: string, uploadedById: number, parentId?: number | null, subjectId?: number | null): Promise<FolderEntity>;
    removeFolder(id: number, userId: number, allowSubjectFolderDeletion?: boolean): Promise<void>;
    private deleteFolderContents;
    private addCounts;
    moveFile(fileId: number, folderId: number | null, userId: number): Promise<FileEntity>;
    remove(id: number): Promise<void>;
    updateFolderSubject(folderId: number, subjectId: number): Promise<void>;
    updateFolderName(folderId: number, name: string): Promise<void>;
    getStorageStats(userId: number, userRole: string): Promise<{
        used: number;
        total: number;
        usedFormatted: string;
        totalFormatted: string;
    }>;
}

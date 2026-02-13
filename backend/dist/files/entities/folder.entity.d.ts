import { User } from '../../users/entities/user.entity';
import { FileEntity } from './file.entity';
export declare class FolderEntity {
    id: number;
    name: string;
    uploadedById: number;
    uploadedBy: User;
    parentId: number;
    parent: FolderEntity;
    subfolders: FolderEntity[];
    files: FileEntity[];
    createdAt: Date;
}

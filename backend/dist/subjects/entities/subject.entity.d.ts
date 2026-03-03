import { User } from "../../users/entities/user.entity";
import { FolderEntity } from "../../files/entities/folder.entity";
export declare class Subject {
    id: number;
    name: string;
    tutorId: number;
    tutor: User;
    folderId: number;
    folder: FolderEntity;
    color: string;
    createdAt: Date;
}

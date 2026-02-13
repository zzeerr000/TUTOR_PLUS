import { User } from "../../users/entities/user.entity";
import { FolderEntity } from "./folder.entity";
import { Homework } from "../../homework/entities/homework.entity";
export declare class FileEntity {
    id: number;
    name: string;
    type: string;
    size: string;
    url: string;
    path: string;
    subject: string;
    uploadedById: number;
    uploadedBy: User;
    assignedToId: number;
    assignedTo: User;
    folderId: number;
    folder: FolderEntity;
    homeworkId: number;
    homework: Homework;
    createdAt: Date;
}

import { User } from "../../users/entities/user.entity";
import { FolderEntity } from "./folder.entity";
import { Homework } from "../../homework/entities/homework.entity";
import { Subject } from "../../subjects/entities/subject.entity";
export declare class FileEntity {
    id: number;
    name: string;
    type: string;
    size: string;
    url: string;
    path: string;
    subjectId: number;
    subject: Subject;
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

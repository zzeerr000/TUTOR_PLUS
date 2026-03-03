import { User } from "../../users/entities/user.entity";
import { FileEntity } from "./file.entity";
import { Subject } from "../../subjects/entities/subject.entity";
export declare class FolderEntity {
    id: number;
    name: string;
    uploadedById: number;
    uploadedBy: User;
    parentId: number;
    parent: FolderEntity;
    subfolders: FolderEntity[];
    files: FileEntity[];
    subjectId: number;
    subject: Subject;
    createdAt: Date;
}

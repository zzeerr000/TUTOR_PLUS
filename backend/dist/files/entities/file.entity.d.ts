import { User } from '../../users/entities/user.entity';
export declare class FileEntity {
    id: number;
    name: string;
    type: string;
    size: string;
    url: string;
    subject: string;
    uploadedById: number;
    uploadedBy: User;
    assignedToId: number;
    assignedTo: User;
    createdAt: Date;
}

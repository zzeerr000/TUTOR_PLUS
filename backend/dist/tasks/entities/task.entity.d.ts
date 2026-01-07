import { User } from '../../users/entities/user.entity';
export declare class Task {
    id: number;
    title: string;
    description: string;
    dueDate: string;
    status: string;
    priority: string;
    userId: number;
    user: User;
    assignedToId: number;
    assignedTo: User;
    createdAt: Date;
}

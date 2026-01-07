import { User } from '../../users/entities/user.entity';
export declare class Transaction {
    id: number;
    amount: number;
    status: string;
    subject: string;
    tutorId: number;
    tutor: User;
    studentId: number;
    student: User;
    dueDate: Date;
    createdAt: Date;
}

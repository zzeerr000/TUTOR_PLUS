import { User } from '../../users/entities/user.entity';
export declare class Event {
    id: number;
    title: string;
    date: string;
    time: string;
    color: string;
    tutorId: number;
    tutor: User;
    studentId: number;
    student: User;
    subject: string;
    paymentPending: boolean;
    transactionId: number;
}

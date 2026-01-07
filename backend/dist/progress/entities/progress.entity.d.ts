import { User } from '../../users/entities/user.entity';
export declare class Progress {
    id: number;
    subject: string;
    progress: number;
    grade: string;
    hoursStudied: number;
    lessonsCompleted: number;
    studentId: number;
    student: User;
    tutorId: number;
    tutor: User;
    createdAt: Date;
}

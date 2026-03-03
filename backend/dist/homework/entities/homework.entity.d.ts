import { User } from '../../users/entities/user.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { Event } from '../../calendar/entities/event.entity';
export declare class Homework {
    id: number;
    lessonId: number;
    lesson: Event;
    tutorId: number;
    tutor: User;
    studentId: number;
    student: User;
    subject: string;
    title: string;
    description: string;
    dueDate: Date;
    status: string;
    studentComment: string;
    question: string;
    questionAnswer: string;
    hasNewQuestion: boolean;
    hasNewAnswer: boolean;
    files: FileEntity[];
    createdAt: Date;
}

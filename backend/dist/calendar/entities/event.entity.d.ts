import { User } from "../../users/entities/user.entity";
import { Subject } from "../../subjects/entities/subject.entity";
export declare class Event {
    id: number;
    title: string;
    date: string;
    time: string;
    timezoneOffsetMinutes: number;
    color: string;
    tutorId: number;
    tutor: User;
    studentId: number;
    student: User;
    subject: string;
    subjectId: number;
    subjectEntity: Subject;
    paymentPending: boolean;
    paymentIgnored: boolean;
    transactionId: number;
    amount: number;
    duration: number;
    notes: string;
}

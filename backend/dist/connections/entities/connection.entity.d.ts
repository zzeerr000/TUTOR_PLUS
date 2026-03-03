import { User } from "../../users/entities/user.entity";
import { Subject } from "../../subjects/entities/subject.entity";
export declare enum ConnectionStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class Connection {
    id: number;
    tutorId: number;
    tutor: User;
    studentId: number;
    student: User;
    status: ConnectionStatus;
    requestedById: number;
    studentAlias: string;
    defaultSubject: string;
    subjects: Subject[];
    defaultPrice: number;
    defaultDuration: number;
    createdAt: Date;
}

import { User } from '../../users/entities/user.entity';
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
    createdAt: Date;
}

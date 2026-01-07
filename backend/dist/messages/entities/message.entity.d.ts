import { User } from '../../users/entities/user.entity';
export declare class Message {
    id: number;
    text: string;
    senderId: number;
    sender: User;
    receiverId: number;
    receiver: User;
    read: boolean;
    createdAt: Date;
}

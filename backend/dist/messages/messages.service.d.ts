import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ConnectionsService } from '../connections/connections.service';
export declare class MessagesService {
    private messagesRepository;
    private connectionsService;
    constructor(messagesRepository: Repository<Message>, connectionsService: ConnectionsService);
    create(createMessageDto: any, senderRole: string): Promise<Message>;
    getConversations(userId: number, userRole: string): Promise<any[]>;
    getMessages(userId: number, otherUserId: number, userRole: string): Promise<Message[]>;
    markAsRead(userId: number, senderId: number): Promise<void>;
    private formatTime;
    private getInitials;
}

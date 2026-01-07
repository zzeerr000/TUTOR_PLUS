import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    getConversations(req: any): Promise<any[]>;
    getMessages(req: any, otherUserId: string): Promise<import("./entities/message.entity").Message[]>;
    create(createMessageDto: any, req: any): Promise<import("./entities/message.entity").Message>;
    markAsRead(req: any, senderId: string): Promise<void>;
}

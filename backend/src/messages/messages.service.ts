import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { ConnectionsService } from '../connections/connections.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionsService: ConnectionsService,
  ) {}

  async create(createMessageDto: any, senderRole: string): Promise<Message> {
    // Verify connection exists
    const senderId = createMessageDto.senderId;
    const receiverId = createMessageDto.receiverId;
    
    const connections = await this.connectionsService.getConnections(senderId, senderRole);
    const isConnected = connections.some(c => 
      (c.tutorId === senderId && c.studentId === receiverId) ||
      (c.studentId === senderId && c.tutorId === receiverId)
    );
    
    if (!isConnected) {
      throw new BadRequestException('Can only message connected users');
    }
    
    const message = this.messagesRepository.create(createMessageDto);
    const saved = await this.messagesRepository.save(message);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async getConversations(userId: number, userRole: string) {
    // Get connected users
    const connections = await this.connectionsService.getConnections(userId, userRole);
    const connectedUserIds = connections.map(c => 
      userRole === 'tutor' ? c.studentId : c.tutorId
    );

    if (connectedUserIds.length === 0) {
      return [];
    }

    // Get all messages with connected users
    const allMessages = await this.messagesRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.receiver', 'receiver')
      .where('(message.senderId = :userId AND message.receiverId IN (:...userIds))', { userId, userIds: connectedUserIds })
      .orWhere('(message.receiverId = :userId AND message.senderId IN (:...userIds))', { userId, userIds: connectedUserIds })
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    const conversations = new Map();
    
    for (const msg of allMessages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      
      if (!conversations.has(otherUserId)) {
        const unreadCount = await this.messagesRepository.count({
          where: { senderId: otherUserId, receiverId: userId, read: false },
        });
        
        conversations.set(otherUserId, {
          id: otherUserId,
          name: otherUser.name,
          lastMessage: msg.text,
          time: this.formatTime(msg.createdAt),
          unread: unreadCount,
          avatar: this.getInitials(otherUser.name),
        });
      }
    }

    return Array.from(conversations.values());
  }

  async getMessages(userId: number, otherUserId: number, userRole: string) {
    // Verify connection exists
    const connections = await this.connectionsService.getConnections(userId, userRole);
    const isConnected = connections.some(c => 
      (c.tutorId === userId && c.studentId === otherUserId) ||
      (c.studentId === userId && c.tutorId === otherUserId)
    );
    
    if (!isConnected) {
      throw new BadRequestException('Can only view messages with connected users');
    }
    
    return this.messagesRepository.find({
      where: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'ASC' },
    });
  }

  async markAsRead(userId: number, senderId: number) {
    await this.messagesRepository.update(
      { senderId, receiverId: userId, read: false },
      { read: true },
    );
  }

  private formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  private getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}


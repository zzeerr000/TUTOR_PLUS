"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const message_entity_1 = require("./entities/message.entity");
const connections_service_1 = require("../connections/connections.service");
let MessagesService = class MessagesService {
    constructor(messagesRepository, connectionsService) {
        this.messagesRepository = messagesRepository;
        this.connectionsService = connectionsService;
    }
    async create(createMessageDto, senderRole) {
        const senderId = createMessageDto.senderId;
        const receiverId = createMessageDto.receiverId;
        const connections = await this.connectionsService.getConnections(senderId, senderRole);
        const isConnected = connections.some(c => (c.tutorId === senderId && c.studentId === receiverId) ||
            (c.studentId === senderId && c.tutorId === receiverId));
        if (!isConnected) {
            throw new common_1.BadRequestException('Can only message connected users');
        }
        const message = this.messagesRepository.create(createMessageDto);
        const saved = await this.messagesRepository.save(message);
        return Array.isArray(saved) ? saved[0] : saved;
    }
    async getConversations(userId, userRole) {
        const connections = await this.connectionsService.getConnections(userId, userRole);
        const connectedUserIds = connections.map(c => userRole === 'tutor' ? c.studentId : c.tutorId);
        if (connectedUserIds.length === 0) {
            return [];
        }
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
    async getMessages(userId, otherUserId, userRole) {
        const connections = await this.connectionsService.getConnections(userId, userRole);
        const isConnected = connections.some(c => (c.tutorId === userId && c.studentId === otherUserId) ||
            (c.studentId === userId && c.tutorId === otherUserId));
        if (!isConnected) {
            throw new common_1.BadRequestException('Can only view messages with connected users');
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
    async markAsRead(userId, senderId) {
        await this.messagesRepository.update({ senderId, receiverId: userId, read: false }, { read: true });
    }
    formatTime(date) {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1)
            return 'Just now';
        if (minutes < 60)
            return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24)
            return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => connections_service_1.ConnectionsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        connections_service_1.ConnectionsService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map
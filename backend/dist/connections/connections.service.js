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
exports.ConnectionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const connection_entity_1 = require("./entities/connection.entity");
const users_service_1 = require("../users/users.service");
let ConnectionsService = class ConnectionsService {
    constructor(connectionsRepository, usersService) {
        this.connectionsRepository = connectionsRepository;
        this.usersService = usersService;
    }
    async createConnectionRequest(requestedById, code) {
        const requester = await this.usersService.findById(requestedById);
        if (!requester) {
            throw new common_1.NotFoundException('Requester not found');
        }
        const targetUser = await this.usersService.findByCode(code);
        if (!targetUser) {
            throw new common_1.NotFoundException('User with this code not found');
        }
        if (targetUser.id === requestedById) {
            throw new common_1.BadRequestException('Cannot connect to yourself');
        }
        if (requester.role === targetUser.role) {
            throw new common_1.BadRequestException('Cannot connect to user with same role');
        }
        const tutorId = requester.role === 'tutor' ? requester.id : targetUser.id;
        const studentId = requester.role === 'student' ? requester.id : targetUser.id;
        const existing = await this.connectionsRepository.findOne({
            where: { tutorId, studentId },
        });
        if (existing) {
            if (existing.status === connection_entity_1.ConnectionStatus.APPROVED) {
                throw new common_1.BadRequestException('Connection already exists');
            }
            if (existing.status === connection_entity_1.ConnectionStatus.PENDING) {
                throw new common_1.BadRequestException('Connection request already pending');
            }
            existing.status = connection_entity_1.ConnectionStatus.PENDING;
            existing.requestedById = requestedById;
            return this.connectionsRepository.save(existing);
        }
        const connection = this.connectionsRepository.create({
            tutorId,
            studentId,
            status: connection_entity_1.ConnectionStatus.PENDING,
            requestedById,
        });
        return this.connectionsRepository.save(connection);
    }
    async getPendingRequests(userId, userRole) {
        if (userRole === 'tutor') {
            return this.connectionsRepository
                .createQueryBuilder('connection')
                .leftJoinAndSelect('connection.student', 'student')
                .where('connection.tutorId = :tutorId', { tutorId: userId })
                .andWhere('connection.status = :status', { status: connection_entity_1.ConnectionStatus.PENDING })
                .andWhere('connection.requestedById != :userId', { userId })
                .orderBy('connection.createdAt', 'DESC')
                .getMany();
        }
        else {
            return this.connectionsRepository
                .createQueryBuilder('connection')
                .leftJoinAndSelect('connection.tutor', 'tutor')
                .where('connection.studentId = :studentId', { studentId: userId })
                .andWhere('connection.status = :status', { status: connection_entity_1.ConnectionStatus.PENDING })
                .andWhere('connection.requestedById != :userId', { userId })
                .orderBy('connection.createdAt', 'DESC')
                .getMany();
        }
    }
    async approveConnection(connectionId, userId) {
        const connection = await this.connectionsRepository.findOne({
            where: { id: connectionId },
            relations: ['tutor', 'student'],
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection request not found');
        }
        const isRecipient = (connection.tutorId === userId && connection.requestedById !== userId) ||
            (connection.studentId === userId && connection.requestedById !== userId);
        if (!isRecipient) {
            throw new common_1.BadRequestException('You cannot approve this request');
        }
        connection.status = connection_entity_1.ConnectionStatus.APPROVED;
        return this.connectionsRepository.save(connection);
    }
    async rejectConnection(connectionId, userId) {
        const connection = await this.connectionsRepository.findOne({
            where: { id: connectionId },
        });
        if (!connection) {
            throw new common_1.NotFoundException('Connection request not found');
        }
        const isRecipient = (connection.tutorId === userId && connection.requestedById !== userId) ||
            (connection.studentId === userId && connection.requestedById !== userId);
        if (!isRecipient) {
            throw new common_1.BadRequestException('You cannot reject this request');
        }
        connection.status = connection_entity_1.ConnectionStatus.REJECTED;
        await this.connectionsRepository.save(connection);
    }
    async getConnections(userId, userRole) {
        if (userRole === 'tutor') {
            return this.connectionsRepository.find({
                where: { tutorId: userId, status: connection_entity_1.ConnectionStatus.APPROVED },
                relations: ['student'],
                order: { createdAt: 'DESC' },
            });
        }
        else {
            return this.connectionsRepository.find({
                where: { studentId: userId, status: connection_entity_1.ConnectionStatus.APPROVED },
                relations: ['tutor'],
                order: { createdAt: 'DESC' },
            });
        }
    }
};
exports.ConnectionsService = ConnectionsService;
exports.ConnectionsService = ConnectionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(connection_entity_1.Connection)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService])
], ConnectionsService);
//# sourceMappingURL=connections.service.js.map
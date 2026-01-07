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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("./entities/transaction.entity");
const connections_service_1 = require("../connections/connections.service");
let FinanceService = class FinanceService {
    constructor(transactionsRepository, connectionsService) {
        this.transactionsRepository = transactionsRepository;
        this.connectionsService = connectionsService;
    }
    async create(createTransactionDto) {
        const connections = await this.connectionsService.getConnections(createTransactionDto.tutorId, 'tutor');
        const isConnected = connections.some(c => c.studentId === createTransactionDto.studentId);
        if (!isConnected) {
            throw new common_1.BadRequestException('Can only create transactions with connected students');
        }
        const transaction = this.transactionsRepository.create(createTransactionDto);
        const saved = await this.transactionsRepository.save(transaction);
        return Array.isArray(saved) ? saved[0] : saved;
    }
    async findAll(userId, userRole) {
        if (userRole === 'tutor') {
            const connections = await this.connectionsService.getConnections(userId, 'tutor');
            const connectedStudentIds = connections.map(c => c.studentId);
            if (connectedStudentIds.length === 0) {
                return [];
            }
            return this.transactionsRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.student', 'student')
                .where('transaction.tutorId = :tutorId', { tutorId: userId })
                .andWhere('transaction.studentId IN (:...studentIds)', { studentIds: connectedStudentIds })
                .orderBy('transaction.createdAt', 'DESC')
                .getMany();
        }
        else {
            const connections = await this.connectionsService.getConnections(userId, 'student');
            const connectedTutorIds = connections.map(c => c.tutorId);
            if (connectedTutorIds.length === 0) {
                return [];
            }
            return this.transactionsRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.tutor', 'tutor')
                .where('transaction.studentId = :studentId', { studentId: userId })
                .andWhere('transaction.tutorId IN (:...tutorIds)', { tutorIds: connectedTutorIds })
                .orderBy('transaction.createdAt', 'DESC')
                .getMany();
        }
    }
    async confirmPayment(transactionId, tutorId) {
        const transaction = await this.transactionsRepository.findOne({
            where: { id: transactionId },
            relations: ['tutor', 'student'],
        });
        if (!transaction) {
            throw new common_1.BadRequestException('Transaction not found');
        }
        if (transaction.tutorId !== tutorId) {
            throw new common_1.ForbiddenException('You can only confirm payments for your own transactions');
        }
        transaction.status = 'completed';
        const updated = await this.transactionsRepository.save(transaction);
        return updated;
    }
    async getStats(userId, userRole) {
        const transactions = await this.findAll(userId, userRole);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const thisMonthTransactions = transactions.filter(t => new Date(t.createdAt) >= thisMonth && t.status === 'completed');
        const lastMonth = new Date(thisMonth);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthTransactions = transactions.filter(t => new Date(t.createdAt) >= lastMonth && new Date(t.createdAt) < thisMonth && t.status === 'completed');
        const thisMonthTotal = thisMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const lastMonthTotal = lastMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const pending = transactions.filter(t => t.status === 'pending');
        const pendingTotal = pending.reduce((sum, t) => sum + Number(t.amount), 0);
        return {
            thisMonth: thisMonthTotal,
            lastMonth: lastMonthTotal,
            pending: pendingTotal,
            pendingCount: pending.length,
        };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => connections_service_1.ConnectionsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        connections_service_1.ConnectionsService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map
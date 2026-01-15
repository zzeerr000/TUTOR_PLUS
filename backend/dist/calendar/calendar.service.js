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
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("./entities/event.entity");
const connections_service_1 = require("../connections/connections.service");
const finance_service_1 = require("../finance/finance.service");
let CalendarService = class CalendarService {
    constructor(eventsRepository, connectionsService, financeService) {
        this.eventsRepository = eventsRepository;
        this.connectionsService = connectionsService;
        this.financeService = financeService;
    }
    async verifyConnection(tutorId, studentId) {
        const connections = await this.connectionsService.getConnections(tutorId, 'tutor');
        const isConnected = connections.some(c => c.studentId === studentId);
        if (!isConnected) {
            throw new common_1.BadRequestException('Tutor and student must be connected to schedule lessons');
        }
    }
    async create(createEventDto) {
        const event = this.eventsRepository.create(createEventDto);
        const saved = await this.eventsRepository.save(event);
        const savedEvent = Array.isArray(saved) ? saved[0] : saved;
        return savedEvent;
    }
    async findAll(userId, userRole) {
        const connections = await this.connectionsService.getConnections(userId, userRole);
        const connectedUserIds = connections.map(c => userRole === 'tutor' ? c.studentId : c.tutorId);
        if (connectedUserIds.length === 0) {
            return [];
        }
        if (userRole === 'tutor') {
            return this.eventsRepository
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.student', 'student')
                .where('event.tutorId = :tutorId', { tutorId: userId })
                .andWhere('event.studentId IN (:...studentIds)', { studentIds: connectedUserIds })
                .orderBy('event.date', 'ASC')
                .addOrderBy('event.time', 'ASC')
                .getMany();
        }
        else {
            return this.eventsRepository
                .createQueryBuilder('event')
                .leftJoinAndSelect('event.tutor', 'tutor')
                .where('event.studentId = :studentId', { studentId: userId })
                .andWhere('event.tutorId IN (:...tutorIds)', { tutorIds: connectedUserIds })
                .orderBy('event.date', 'ASC')
                .addOrderBy('event.time', 'ASC')
                .getMany();
        }
    }
    async findOne(id) {
        return this.eventsRepository.findOne({
            where: { id },
            relations: ['student', 'tutor'],
        });
    }
    async updatePaymentStatus(transactionId, status) {
        await this.eventsRepository.update({ transactionId }, { paymentPending: status });
    }
    async update(id, updateEventDto) {
        await this.eventsRepository.update(id, updateEventDto);
        const updated = await this.eventsRepository.findOne({
            where: { id },
            relations: ['student', 'tutor'],
        });
        if (!updated) {
            throw new Error('Event not found');
        }
        return updated;
    }
    async remove(id) {
        await this.eventsRepository.delete(id);
    }
    async removeRecurring(id) {
        const event = await this.eventsRepository.findOne({ where: { id } });
        if (!event)
            return;
        const { studentId, time, date, tutorId } = event;
        const sourceDate = new Date(date);
        const dayOfWeek = sourceDate.getDay();
        const allEvents = await this.eventsRepository.find({
            where: {
                studentId,
                time,
                tutorId
            }
        });
        const eventsToDelete = allEvents.filter(e => {
            const eDate = new Date(e.date);
            return eDate.getDay() === dayOfWeek && e.date >= date;
        });
        if (eventsToDelete.length > 0) {
            await this.eventsRepository.remove(eventsToDelete);
        }
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => finance_service_1.FinanceService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        connections_service_1.ConnectionsService,
        finance_service_1.FinanceService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map
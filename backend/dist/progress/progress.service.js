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
exports.ProgressService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const progress_entity_1 = require("./entities/progress.entity");
const connections_service_1 = require("../connections/connections.service");
let ProgressService = class ProgressService {
    constructor(progressRepository, connectionsService) {
        this.progressRepository = progressRepository;
        this.connectionsService = connectionsService;
    }
    async create(createProgressDto) {
        const connections = await this.connectionsService.getConnections(createProgressDto.tutorId, 'tutor');
        const isConnected = connections.some(c => c.studentId === createProgressDto.studentId);
        if (!isConnected) {
            throw new common_1.BadRequestException('Can only track progress for connected students');
        }
        const progress = this.progressRepository.create(createProgressDto);
        const saved = await this.progressRepository.save(progress);
        return Array.isArray(saved) ? saved[0] : saved;
    }
    async findAll(userId, userRole) {
        if (userRole === 'tutor') {
            const connections = await this.connectionsService.getConnections(userId, 'tutor');
            const connectedStudentIds = connections.map(c => c.studentId);
            if (connectedStudentIds.length === 0) {
                return [];
            }
            return this.progressRepository
                .createQueryBuilder('progress')
                .leftJoinAndSelect('progress.student', 'student')
                .where('progress.tutorId = :tutorId', { tutorId: userId })
                .andWhere('progress.studentId IN (:...studentIds)', { studentIds: connectedStudentIds })
                .orderBy('progress.createdAt', 'DESC')
                .getMany();
        }
        else {
            const connections = await this.connectionsService.getConnections(userId, 'student');
            const connectedTutorIds = connections.map(c => c.tutorId);
            if (connectedTutorIds.length === 0) {
                return [];
            }
            return this.progressRepository
                .createQueryBuilder('progress')
                .leftJoinAndSelect('progress.tutor', 'tutor')
                .where('progress.studentId = :studentId', { studentId: userId })
                .andWhere('progress.tutorId IN (:...tutorIds)', { tutorIds: connectedTutorIds })
                .orderBy('progress.createdAt', 'DESC')
                .getMany();
        }
    }
    async getOverallStats(userId, userRole) {
        const progress = await this.findAll(userId, userRole);
        if (progress.length === 0) {
            return { overallProgress: 0, totalHours: 0 };
        }
        const overallProgress = progress.reduce((sum, p) => sum + Number(p.progress), 0) / progress.length;
        const totalHours = progress.reduce((sum, p) => sum + Number(p.hoursStudied), 0);
        return { overallProgress: Math.round(overallProgress), totalHours: Math.round(totalHours) };
    }
};
exports.ProgressService = ProgressService;
exports.ProgressService = ProgressService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => connections_service_1.ConnectionsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        connections_service_1.ConnectionsService])
], ProgressService);
//# sourceMappingURL=progress.service.js.map
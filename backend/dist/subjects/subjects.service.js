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
exports.SubjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const subject_entity_1 = require("./entities/subject.entity");
const files_service_1 = require("../files/files.service");
const connections_service_1 = require("../connections/connections.service");
let SubjectsService = class SubjectsService {
    constructor(subjectsRepository, filesService, connectionsService) {
        this.subjectsRepository = subjectsRepository;
        this.filesService = filesService;
        this.connectionsService = connectionsService;
    }
    async create(tutorId, createSubjectDto) {
        const folder = await this.filesService.createFolder(createSubjectDto.name, tutorId, null);
        const subject = this.subjectsRepository.create({
            ...createSubjectDto,
            tutorId,
            folderId: folder.id,
        });
        const savedSubject = await this.subjectsRepository.save(subject);
        await this.filesService.updateFolderSubject(folder.id, savedSubject.id);
        return savedSubject;
    }
    async findAll(userId, userRole = "tutor") {
        if (userRole === "tutor") {
            return this.subjectsRepository.find({
                where: { tutorId: userId },
                order: { name: "ASC" },
            });
        }
        else {
            const connections = await this.connectionsService.getConnections(userId, "student");
            const subjectIds = new Set();
            connections.forEach((connection) => {
                if (connection.subjects && connection.subjects.length > 0) {
                    connection.subjects.forEach((subject) => subjectIds.add(subject.id));
                }
            });
            if (subjectIds.size === 0) {
                return [];
            }
            return this.subjectsRepository.find({
                where: { id: (0, typeorm_2.In)(Array.from(subjectIds)) },
                order: { name: "ASC" },
            });
        }
    }
    async findOne(id) {
        return this.subjectsRepository.findOne({ where: { id } });
    }
    async update(id, updateSubjectDto) {
        const subject = await this.findOne(id);
        if (!subject) {
            throw new common_1.NotFoundException("Subject not found");
        }
        if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
            await this.filesService.updateFolderName(subject.folderId, updateSubjectDto.name);
        }
        await this.subjectsRepository.update(id, updateSubjectDto);
        return this.findOne(id);
    }
    async findByIds(ids) {
        if (!ids || ids.length === 0) {
            return [];
        }
        return this.subjectsRepository.find({
            where: { id: (0, typeorm_2.In)(ids) },
        });
    }
    async remove(id) {
        const subject = await this.findOne(id);
        if (!subject) {
            throw new common_1.NotFoundException("Subject not found");
        }
        if (subject.folderId) {
            await this.filesService.removeFolder(subject.folderId, subject.tutorId, true);
        }
        return this.subjectsRepository.delete(id);
    }
};
exports.SubjectsService = SubjectsService;
exports.SubjectsService = SubjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subject_entity_1.Subject)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => files_service_1.FilesService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => connections_service_1.ConnectionsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        files_service_1.FilesService,
        connections_service_1.ConnectionsService])
], SubjectsService);
//# sourceMappingURL=subjects.service.js.map
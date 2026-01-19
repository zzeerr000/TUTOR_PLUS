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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const file_entity_1 = require("./entities/file.entity");
const connections_service_1 = require("../connections/connections.service");
const fs = require("fs");
const path = require("path");
let FilesService = class FilesService {
    constructor(filesRepository, connectionsService) {
        this.filesRepository = filesRepository;
        this.connectionsService = connectionsService;
        this.uploadPath = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }
    async uploadFile(file, data) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const assignedToId = data.assignedToId ? parseInt(data.assignedToId) : null;
        const uploadedById = data.uploadedById;
        if (assignedToId) {
            const connections = await this.connectionsService.getConnections(uploadedById, 'tutor');
            const isConnected = connections.some(c => c.studentId === assignedToId);
            if (!isConnected) {
                throw new common_1.BadRequestException('Can only assign files to connected students');
            }
        }
        const fileName = data.name || file.originalname;
        const fileExtension = path.extname(file.originalname);
        const storedFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
        const filePath = path.join(this.uploadPath, storedFileName);
        fs.writeFileSync(filePath, file.buffer);
        let type = 'document';
        const mimetype = file.mimetype;
        if (mimetype.startsWith('video/'))
            type = 'video';
        else if (mimetype.startsWith('image/'))
            type = 'image';
        const formatBytes = (bytes) => {
            if (bytes >= 1024 * 1024 * 1024)
                return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
            if (bytes >= 1024 * 1024)
                return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
            if (bytes >= 1024)
                return `${(bytes / 1024).toFixed(2)} KB`;
            return `${bytes} B`;
        };
        const fileEntity = this.filesRepository.create({
            name: fileName,
            type: type,
            size: formatBytes(file.size),
            path: filePath,
            subject: data.subject || 'Other',
            uploadedById: uploadedById,
            assignedToId: assignedToId,
        });
        return this.filesRepository.save(fileEntity);
    }
    async getFileForDownload(id, userId, userRole) {
        const file = await this.filesRepository.findOne({
            where: { id },
            relations: ['uploadedBy', 'assignedTo'],
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        if (userRole === 'tutor') {
            if (file.uploadedById !== userId) {
                throw new common_1.ForbiddenException('You do not have permission to download this file');
            }
        }
        else {
            if (file.assignedToId && file.assignedToId !== userId) {
                throw new common_1.ForbiddenException('You do not have permission to download this file');
            }
            const connections = await this.connectionsService.getConnections(userId, 'student');
            const connectedTutorIds = connections.map(c => c.tutorId);
            if (!connectedTutorIds.includes(file.uploadedById)) {
                throw new common_1.ForbiddenException('You can only download files from connected tutors');
            }
        }
        if (!fs.existsSync(file.path)) {
            throw new common_1.NotFoundException('File not found on disk');
        }
        return file;
    }
    async findAll(userId, userRole) {
        if (userRole === 'tutor') {
            return this.filesRepository
                .createQueryBuilder('file')
                .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
                .leftJoinAndSelect('file.assignedTo', 'assignedTo')
                .where('file.uploadedById = :userId', { userId })
                .orderBy('file.createdAt', 'DESC')
                .getMany();
        }
        else {
            const connections = await this.connectionsService.getConnections(userId, 'student');
            const connectedTutorIds = connections.map(c => c.tutorId);
            if (connectedTutorIds.length === 0) {
                return [];
            }
            return this.filesRepository
                .createQueryBuilder('file')
                .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
                .leftJoinAndSelect('file.assignedTo', 'assignedTo')
                .where('file.assignedToId = :userId', { userId })
                .orWhere('(file.assignedToId IS NULL AND file.uploadedById IN (:...tutorIds))', { tutorIds: connectedTutorIds })
                .orderBy('file.createdAt', 'DESC')
                .getMany();
        }
    }
    async remove(id) {
        const file = await this.filesRepository.findOne({ where: { id } });
        if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        await this.filesRepository.delete(id);
    }
    async getStorageStats(userId, userRole) {
        const files = await this.findAll(userId, userRole);
        let totalBytes = 0;
        files.forEach(file => {
            const sizeStr = file.size || '0 B';
            const sizeMatch = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
            if (sizeMatch) {
                const value = parseFloat(sizeMatch[1]);
                const unit = sizeMatch[2].toUpperCase();
                switch (unit) {
                    case 'GB':
                        totalBytes += value * 1024 * 1024 * 1024;
                        break;
                    case 'MB':
                        totalBytes += value * 1024 * 1024;
                        break;
                    case 'KB':
                        totalBytes += value * 1024;
                        break;
                    default:
                        totalBytes += value;
                }
            }
        });
        const totalGB = 5;
        const totalBytesLimit = totalGB * 1024 * 1024 * 1024;
        const formatBytes = (bytes) => {
            if (bytes >= 1024 * 1024 * 1024) {
                return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
            }
            else if (bytes >= 1024 * 1024) {
                return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
            }
            else if (bytes >= 1024) {
                return `${(bytes / 1024).toFixed(2)} KB`;
            }
            return `${bytes} B`;
        };
        return {
            used: totalBytes,
            total: totalBytesLimit,
            usedFormatted: formatBytes(totalBytes),
            totalFormatted: `${totalGB} GB`,
        };
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(file_entity_1.FileEntity)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => connections_service_1.ConnectionsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        connections_service_1.ConnectionsService])
], FilesService);
//# sourceMappingURL=files.service.js.map
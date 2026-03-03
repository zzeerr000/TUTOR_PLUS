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
const folder_entity_1 = require("./entities/folder.entity");
const homework_entity_1 = require("../homework/entities/homework.entity");
const connections_service_1 = require("../connections/connections.service");
const fs = require("fs");
const path = require("path");
let FilesService = class FilesService {
    constructor(filesRepository, foldersRepository, homeworkRepository, connectionsService) {
        this.filesRepository = filesRepository;
        this.foldersRepository = foldersRepository;
        this.homeworkRepository = homeworkRepository;
        this.connectionsService = connectionsService;
        this.uploadPath = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }
    async uploadFile(file, data) {
        if (!file) {
            throw new common_1.BadRequestException("No file uploaded");
        }
        const assignedToId = data.assignedToId ? parseInt(data.assignedToId) : null;
        const uploadedById = data.uploadedById;
        const folderId = data.folderId ? parseInt(data.folderId) : null;
        const homeworkId = data.homeworkId ? parseInt(data.homeworkId) : null;
        if (assignedToId) {
            const connections = await this.connectionsService.getConnections(uploadedById, "tutor");
            const isConnected = connections.some((c) => c.studentId === assignedToId);
            if (!isConnected) {
                throw new common_1.BadRequestException("Can only assign files to connected students");
            }
        }
        const fileName = data.name || file.originalname;
        const fileExtension = path.extname(file.originalname);
        const storedFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
        const filePath = path.join(this.uploadPath, storedFileName);
        fs.writeFileSync(filePath, file.buffer);
        let type = "document";
        const mimetype = file.mimetype;
        if (mimetype.startsWith("video/"))
            type = "video";
        else if (mimetype.startsWith("image/"))
            type = "image";
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
            subjectId: data.subjectId ? parseInt(data.subjectId) : null,
            uploadedById: uploadedById,
            assignedToId: assignedToId,
            folderId: folderId,
            homeworkId: homeworkId,
        });
        return this.filesRepository.save(fileEntity);
    }
    async getFileForDownload(id, userId, userRole) {
        const file = await this.filesRepository.findOne({
            where: { id },
            relations: ["uploadedBy", "assignedTo"],
        });
        if (!file) {
            throw new common_1.NotFoundException("File not found");
        }
        if (userRole === "tutor") {
            if (file.uploadedById !== userId) {
                throw new common_1.ForbiddenException("You do not have permission to download this file");
            }
        }
        else {
            let hasAccess = false;
            if (file.assignedToId === userId) {
                hasAccess = true;
            }
            else if (file.homeworkId) {
                const homework = await this.homeworkRepository.findOne({
                    where: { id: file.homeworkId },
                });
                if (homework && homework.studentId === userId) {
                    hasAccess = true;
                }
            }
            if (!hasAccess) {
                const connections = await this.connectionsService.getConnections(userId, "student");
                const connectedTutorIds = connections.map((c) => c.tutorId);
                if (!connectedTutorIds.includes(file.uploadedById)) {
                    throw new common_1.ForbiddenException("You do not have permission to download this file");
                }
            }
        }
        if (!fs.existsSync(file.path)) {
            throw new common_1.NotFoundException("File not found on disk");
        }
        return file;
    }
    async findAll(userId, userRole, folderId = null, filterSubjectId = null) {
        if (userRole === "tutor") {
            const folderWhere = {
                uploadedById: userId,
                parentId: folderId,
            };
            if (filterSubjectId) {
                folderWhere.subjectId = filterSubjectId;
            }
            const folders = await this.foldersRepository.find({
                where: folderWhere,
                relations: ["subject", "uploadedBy"],
                order: { name: "ASC" },
            });
            const filesQuery = this.filesRepository
                .createQueryBuilder("file")
                .leftJoinAndSelect("file.uploadedBy", "uploadedBy")
                .leftJoinAndSelect("file.assignedTo", "assignedTo")
                .leftJoinAndSelect("file.subject", "subject")
                .where("file.uploadedById = :userId", { userId })
                .andWhere(folderId ? "file.folderId = :folderId" : "file.folderId IS NULL", { folderId })
                .orderBy("file.createdAt", "DESC");
            if (filterSubjectId) {
                filesQuery.andWhere("file.subjectId = :filterSubjectId", {
                    filterSubjectId,
                });
            }
            const files = await filesQuery.getMany();
            const foldersWithCounts = await this.addCounts(folders);
            return { files, folders: foldersWithCounts };
        }
        else {
            const connections = await this.connectionsService.getConnections(userId, "student");
            const connectedTutorIds = connections.map((c) => c.tutorId);
            if (connectedTutorIds.length === 0) {
                return { files: [], folders: [] };
            }
            let allowedSubjectIds = connections
                .flatMap((c) => c.subjects || [])
                .map((s) => s.id);
            if (filterSubjectId) {
                if (allowedSubjectIds.length > 0 &&
                    !allowedSubjectIds.includes(filterSubjectId)) {
                    return { files: [], folders: [] };
                }
                allowedSubjectIds = [filterSubjectId];
            }
            const whereConditions = [];
            if (!filterSubjectId) {
                whereConditions.push({
                    uploadedById: (0, typeorm_2.In)(connectedTutorIds),
                    parentId: folderId,
                    subjectId: (0, typeorm_2.IsNull)(),
                });
            }
            if (allowedSubjectIds.length > 0) {
                whereConditions.push({
                    uploadedById: (0, typeorm_2.In)(connectedTutorIds),
                    parentId: folderId,
                    subjectId: (0, typeorm_2.In)(allowedSubjectIds),
                });
            }
            else if (filterSubjectId) {
            }
            const folders = await this.foldersRepository.find({
                where: whereConditions,
                relations: ["subject", "uploadedBy"],
                order: { name: "ASC" },
            });
            const filesQuery = this.filesRepository
                .createQueryBuilder("file")
                .leftJoinAndSelect("file.uploadedBy", "uploadedBy")
                .leftJoinAndSelect("file.assignedTo", "assignedTo")
                .leftJoinAndSelect("file.subject", "subject")
                .where("(file.assignedToId = :userId OR (file.assignedToId IS NULL AND file.uploadedById IN (:...tutorIds)))", { userId, tutorIds: connectedTutorIds })
                .andWhere(folderId ? "file.folderId = :folderId" : "file.folderId IS NULL", { folderId })
                .orderBy("file.createdAt", "DESC");
            filesQuery.andWhere(new typeorm_2.Brackets((qb) => {
                if (!filterSubjectId) {
                    qb.where("file.subjectId IS NULL");
                }
                else {
                    qb.where("1=0");
                }
                if (allowedSubjectIds.length > 0) {
                    qb.orWhere("file.subjectId IN (:...allowedSubjectIds)", {
                        allowedSubjectIds,
                    });
                }
            }));
            const files = await filesQuery.getMany();
            return { files, folders };
        }
    }
    async createFolder(name, uploadedById, parentId = null, subjectId = null) {
        const folder = this.foldersRepository.create({
            name,
            uploadedById,
            parentId,
            subjectId,
        });
        return this.foldersRepository.save(folder);
    }
    async removeFolder(id, userId, allowSubjectFolderDeletion = false) {
        const folder = await this.foldersRepository.findOne({
            where: { id, uploadedById: userId },
        });
        if (!folder) {
            throw new common_1.NotFoundException("Folder not found or you do not have permission");
        }
        if (folder.subjectId && !folder.parentId && !allowSubjectFolderDeletion) {
            throw new common_1.ForbiddenException("Нельзя удалить корневую папку предмета. Удалите предмет, чтобы удалить папку.");
        }
        await this.deleteFolderContents(id);
        await this.foldersRepository.delete(id);
    }
    async deleteFolderContents(folderId) {
        const files = await this.filesRepository.find({ where: { folderId } });
        for (const file of files) {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
        const subfolders = await this.foldersRepository.find({
            where: { parentId: folderId },
        });
        for (const sub of subfolders) {
            await this.deleteFolderContents(sub.id);
        }
    }
    async addCounts(folders) {
        return Promise.all(folders.map(async (folder) => {
            const subfoldersCount = await this.foldersRepository.count({
                where: { parentId: folder.id },
            });
            const filesCount = await this.filesRepository.count({
                where: { folderId: folder.id },
            });
            return { ...folder, subfoldersCount, filesCount };
        }));
    }
    async moveFile(fileId, folderId, userId) {
        const file = await this.filesRepository.findOne({
            where: { id: fileId, uploadedById: userId },
        });
        if (!file) {
            throw new common_1.NotFoundException("File not found");
        }
        file.folderId = folderId;
        return this.filesRepository.save(file);
    }
    async remove(id) {
        const file = await this.filesRepository.findOne({ where: { id } });
        if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        await this.filesRepository.delete(id);
    }
    async updateFolderSubject(folderId, subjectId) {
        await this.foldersRepository.update(folderId, { subjectId });
    }
    async updateFolderName(folderId, name) {
        await this.foldersRepository.update(folderId, { name });
    }
    async getStorageStats(userId, userRole) {
        let files = [];
        if (userRole === "tutor") {
            files = await this.filesRepository.find({
                where: { uploadedById: userId },
            });
        }
        else {
            const res = await this.findAll(userId, userRole);
            files = res.files;
        }
        let totalBytes = 0;
        files.forEach((file) => {
            const sizeStr = file.size || "0 B";
            const sizeMatch = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
            if (sizeMatch) {
                const value = parseFloat(sizeMatch[1]);
                const unit = sizeMatch[2].toUpperCase();
                switch (unit) {
                    case "GB":
                        totalBytes += value * 1024 * 1024 * 1024;
                        break;
                    case "MB":
                        totalBytes += value * 1024 * 1024;
                        break;
                    case "KB":
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
    __param(1, (0, typeorm_1.InjectRepository)(folder_entity_1.FolderEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(homework_entity_1.Homework)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => connections_service_1.ConnectionsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        connections_service_1.ConnectionsService])
], FilesService);
//# sourceMappingURL=files.service.js.map
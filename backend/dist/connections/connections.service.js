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
const calendar_service_1 = require("../calendar/calendar.service");
const homework_service_1 = require("../homework/homework.service");
const subjects_service_1 = require("../subjects/subjects.service");
let ConnectionsService = class ConnectionsService {
    constructor(connectionsRepository, usersService, dataSource, calendarService, homeworkService, subjectsService) {
        this.connectionsRepository = connectionsRepository;
        this.usersService = usersService;
        this.dataSource = dataSource;
        this.calendarService = calendarService;
        this.homeworkService = homeworkService;
        this.subjectsService = subjectsService;
    }
    getEventStartUtc(event) {
        if (!event?.date || !event?.time)
            return null;
        const [y, m, d] = String(event.date).split("-").map(Number);
        if (!y || !m || !d)
            return null;
        const timeStr = String(event.time);
        let hour24 = 0;
        let minute = 0;
        if (timeStr.includes("AM") || timeStr.includes("PM")) {
            const [timePart, period] = timeStr.split(" ");
            const [hours, minutes] = timePart.split(":");
            hour24 = parseInt(hours, 10);
            if (period === "PM" && hour24 !== 12) {
                hour24 += 12;
            }
            else if (period === "AM" && hour24 === 12) {
                hour24 = 0;
            }
            minute = parseInt(minutes, 10);
        }
        else {
            const [hours, minutes] = timeStr.split(":");
            hour24 = parseInt(hours, 10);
            minute = parseInt(minutes, 10);
        }
        if (Number.isNaN(hour24) || Number.isNaN(minute))
            return null;
        const offsetMinutes = Number(event.timezoneOffsetMinutes || 0);
        const utcMs = Date.UTC(y, m - 1, d, hour24, minute, 0, 0) +
            offsetMinutes * 60_000;
        return new Date(utcMs);
    }
    async createConnectionRequest(requestedById, code) {
        const requester = await this.usersService.findById(requestedById);
        if (!requester) {
            throw new common_1.NotFoundException("Requester not found");
        }
        const targetUser = await this.usersService.findByCode(code);
        if (!targetUser) {
            throw new common_1.NotFoundException("User with this code not found");
        }
        if (targetUser.id === requestedById) {
            throw new common_1.BadRequestException("Cannot connect to yourself");
        }
        if (requester.role === targetUser.role) {
            throw new common_1.BadRequestException("Cannot connect to user with same role");
        }
        const tutorId = requester.role === "tutor" ? requester.id : targetUser.id;
        const studentId = requester.role === "student" ? requester.id : targetUser.id;
        const existing = await this.connectionsRepository.findOne({
            where: { tutorId, studentId },
        });
        if (existing) {
            if (existing.status === connection_entity_1.ConnectionStatus.APPROVED) {
                throw new common_1.BadRequestException("Connection already exists");
            }
            if (existing.status === connection_entity_1.ConnectionStatus.PENDING) {
                throw new common_1.BadRequestException("Connection request already pending");
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
        if (userRole === "tutor") {
            return this.connectionsRepository
                .createQueryBuilder("connection")
                .leftJoinAndSelect("connection.student", "student")
                .where("connection.tutorId = :tutorId", { tutorId: userId })
                .andWhere("connection.status = :status", {
                status: connection_entity_1.ConnectionStatus.PENDING,
            })
                .andWhere("connection.requestedById != :userId", { userId })
                .orderBy("connection.createdAt", "DESC")
                .getMany();
        }
        else {
            return this.connectionsRepository
                .createQueryBuilder("connection")
                .leftJoinAndSelect("connection.tutor", "tutor")
                .where("connection.studentId = :studentId", { studentId: userId })
                .andWhere("connection.status = :status", {
                status: connection_entity_1.ConnectionStatus.PENDING,
            })
                .andWhere("connection.requestedById != :userId", { userId })
                .orderBy("connection.createdAt", "DESC")
                .getMany();
        }
    }
    async approveConnection(connectionId, userId, existingStudentId) {
        const connection = await this.connectionsRepository.findOne({
            where: { id: connectionId },
            relations: ["tutor", "student"],
        });
        if (!connection) {
            throw new common_1.NotFoundException("Connection request not found");
        }
        const isRecipient = (connection.tutorId === userId && connection.requestedById !== userId) ||
            (connection.studentId === userId && connection.requestedById !== userId);
        if (!isRecipient) {
            throw new common_1.BadRequestException("You cannot approve this request");
        }
        if (existingStudentId) {
            await this.mergeVirtualStudent(userId, existingStudentId, connection.studentId);
            const virtualUser = await this.usersService.findById(existingStudentId);
            if (virtualUser && virtualUser.isVirtual) {
                await this.connectionsRepository.delete({
                    tutorId: userId,
                    studentId: existingStudentId,
                });
                await this.usersService.deleteAccount(existingStudentId);
            }
        }
        connection.status = connection_entity_1.ConnectionStatus.APPROVED;
        return this.connectionsRepository.save(connection);
    }
    async mergeVirtualStudent(tutorId, virtualStudentId, realStudentId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.query("UPDATE events SET studentId = ? WHERE tutorId = ? AND studentId = ?", [realStudentId, tutorId, virtualStudentId]);
            await queryRunner.query("UPDATE tasks SET assignedToId = ? WHERE userId = ? AND assignedToId = ?", [realStudentId, tutorId, virtualStudentId]);
            await queryRunner.query("UPDATE files SET assignedToId = ? WHERE uploadedById = ? AND assignedToId = ?", [realStudentId, tutorId, virtualStudentId]);
            await queryRunner.query("UPDATE progress SET studentId = ? WHERE tutorId = ? AND studentId = ?", [realStudentId, tutorId, virtualStudentId]);
            await queryRunner.query("UPDATE transactions SET studentId = ? WHERE tutorId = ? AND studentId = ?", [realStudentId, tutorId, virtualStudentId]);
            await queryRunner.query("UPDATE messages SET senderId = ? WHERE receiverId = ? AND senderId = ?", [realStudentId, tutorId, virtualStudentId]);
            await queryRunner.query("UPDATE messages SET receiverId = ? WHERE senderId = ? AND receiverId = ?", [realStudentId, tutorId, virtualStudentId]);
            await queryRunner.commitTransaction();
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async linkVirtualStudentByCode(tutorId, virtualStudentId, studentCode) {
        const realStudent = await this.usersService.findByCode(studentCode);
        if (!realStudent) {
            throw new common_1.NotFoundException("Student with this code not found");
        }
        if (realStudent.role !== "student") {
            throw new common_1.BadRequestException("Code belongs to a tutor");
        }
        let connection = await this.connectionsRepository.findOne({
            where: { tutorId, studentId: realStudent.id },
        });
        if (!connection) {
            connection = this.connectionsRepository.create({
                tutorId,
                studentId: realStudent.id,
                status: connection_entity_1.ConnectionStatus.APPROVED,
                requestedById: tutorId,
            });
        }
        else {
            connection.status = connection_entity_1.ConnectionStatus.APPROVED;
        }
        await this.mergeVirtualStudent(tutorId, virtualStudentId, realStudent.id);
        await this.connectionsRepository.delete({
            tutorId,
            studentId: virtualStudentId,
        });
        await this.usersService.deleteAccount(virtualStudentId);
        return this.connectionsRepository.save(connection);
    }
    async rejectConnection(connectionId, userId) {
        const connection = await this.connectionsRepository.findOne({
            where: { id: connectionId },
        });
        if (!connection) {
            throw new common_1.NotFoundException("Connection request not found");
        }
        const isRecipient = (connection.tutorId === userId && connection.requestedById !== userId) ||
            (connection.studentId === userId && connection.requestedById !== userId);
        if (!isRecipient) {
            throw new common_1.BadRequestException("You cannot reject this request");
        }
        connection.status = connection_entity_1.ConnectionStatus.REJECTED;
        await this.connectionsRepository.save(connection);
    }
    async deleteConnection(connectionId, userId, deleteData) {
        const connection = await this.connectionsRepository.findOne({
            where: { id: connectionId },
        });
        if (!connection) {
            throw new common_1.NotFoundException("Connection not found");
        }
        const isParticipant = connection.tutorId === userId || connection.studentId === userId;
        if (!isParticipant) {
            throw new common_1.BadRequestException("You cannot delete this connection");
        }
        if (deleteData) {
            await this.calendarService.deleteEventsBetweenUsers(connection.tutorId, connection.studentId);
        }
        await this.connectionsRepository.remove(connection);
    }
    async getConnections(userId, userRole) {
        if (userRole === "tutor") {
            return this.connectionsRepository.find({
                where: { tutorId: userId, status: connection_entity_1.ConnectionStatus.APPROVED },
                relations: ["student", "subjects"],
                order: { createdAt: "DESC" },
            });
        }
        else {
            return this.connectionsRepository.find({
                where: { studentId: userId, status: connection_entity_1.ConnectionStatus.APPROVED },
                relations: ["tutor", "subjects"],
                order: { createdAt: "DESC" },
            });
        }
    }
    async updateSubjects(connectionId, tutorId, subjectIds) {
        const connection = await this.connectionsRepository.findOne({
            where: { id: connectionId, tutorId, status: connection_entity_1.ConnectionStatus.APPROVED },
            relations: ["subjects"],
        });
        if (!connection) {
            throw new common_1.NotFoundException("Connection not found");
        }
        if (subjectIds) {
            const subjects = await this.subjectsService.findByIds(subjectIds);
            connection.subjects = subjects;
        }
        return this.connectionsRepository.save(connection);
    }
    async createManualStudent(tutorId, name, defaultSubject, defaultPrice, defaultDuration, subjectIds) {
        const student = await this.usersService.createVirtualStudent(name);
        let subjects = [];
        if (subjectIds && subjectIds.length > 0) {
            subjects = await this.subjectsService.findByIds(subjectIds);
        }
        const connection = this.connectionsRepository.create({
            tutorId,
            studentId: student.id,
            status: connection_entity_1.ConnectionStatus.APPROVED,
            requestedById: tutorId,
            defaultSubject,
            defaultPrice,
            defaultDuration,
            subjects,
        });
        return this.connectionsRepository.save(connection);
    }
    async updateStudentAlias(tutorId, studentId, data) {
        const connection = await this.connectionsRepository.findOne({
            where: { tutorId, studentId, status: connection_entity_1.ConnectionStatus.APPROVED },
            relations: ["subjects"],
        });
        if (!connection) {
            throw new common_1.NotFoundException("Connection not found");
        }
        if (data.alias !== undefined)
            connection.studentAlias = data.alias;
        if (data.defaultSubject !== undefined)
            connection.defaultSubject = data.defaultSubject;
        if (data.defaultPrice !== undefined)
            connection.defaultPrice = data.defaultPrice;
        if (data.defaultDuration !== undefined)
            connection.defaultDuration = data.defaultDuration;
        if (data.subjectIds) {
            const subjects = await this.subjectsService.findByIds(data.subjectIds);
            connection.subjects = subjects;
        }
        return this.connectionsRepository.save(connection);
    }
    async removeStudent(tutorId, studentId) {
        const connection = await this.connectionsRepository.findOne({
            where: { tutorId, studentId },
            relations: ["student"],
        });
        if (!connection) {
            throw new common_1.NotFoundException("Connection not found");
        }
        const isVirtual = connection.student?.isVirtual;
        await this.connectionsRepository.remove(connection);
        if (isVirtual) {
            await this.usersService.deleteAccount(studentId);
        }
    }
    async getStudentStats(tutorId, studentId) {
        const connection = await this.connectionsRepository.findOne({
            where: { tutorId, studentId, status: connection_entity_1.ConnectionStatus.APPROVED },
        });
        if (!connection) {
            throw new common_1.NotFoundException("Connection not found");
        }
        const allEvents = await this.calendarService.findAll(tutorId, "tutor");
        const studentEvents = allEvents
            .filter((e) => e.studentId === studentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() ||
            b.time.localeCompare(a.time));
        const now = new Date();
        const pastLessons = studentEvents.filter((e) => {
            const eventStartUtc = this.getEventStartUtc(e);
            if (!eventStartUtc)
                return false;
            return eventStartUtc.getTime() < now.getTime();
        });
        const upcomingLessons = studentEvents
            .filter((e) => {
            const eventStartUtc = this.getEventStartUtc(e);
            if (!eventStartUtc)
                return false;
            return eventStartUtc.getTime() >= now.getTime();
        })
            .sort((a, b) => {
            const aStart = this.getEventStartUtc(a);
            const bStart = this.getEventStartUtc(b);
            if (!aStart && !bStart)
                return 0;
            if (!aStart)
                return 1;
            if (!bStart)
                return -1;
            return aStart.getTime() - bStart.getTime();
        });
        const filteredLessonsHistory = [...upcomingLessons, ...pastLessons];
        const allHomework = await this.homeworkService.findAll(tutorId, "tutor");
        const studentHomework = allHomework.filter((h) => h.studentId === studentId && h.status !== "draft");
        const activeHW = studentHomework.filter((h) => h.status === "pending").length;
        const missedHW = studentHomework.filter((h) => h.status === "missed").length;
        const completedHW = studentHomework.filter((h) => h.status === "completed").length;
        return {
            lessonsCount: pastLessons.length,
            activeHomework: activeHW,
            missedHomework: missedHW,
            completedHomework: completedHW,
            lessonsHistory: filteredLessonsHistory,
            homeworkHistory: studentHomework,
        };
    }
};
exports.ConnectionsService = ConnectionsService;
exports.ConnectionsService = ConnectionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(connection_entity_1.Connection)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => calendar_service_1.CalendarService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => subjects_service_1.SubjectsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_1.UsersService,
        typeorm_2.DataSource,
        calendar_service_1.CalendarService,
        homework_service_1.HomeworkService,
        subjects_service_1.SubjectsService])
], ConnectionsService);
//# sourceMappingURL=connections.service.js.map
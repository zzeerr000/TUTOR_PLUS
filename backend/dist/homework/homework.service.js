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
exports.HomeworkService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const homework_entity_1 = require("./entities/homework.entity");
const event_entity_1 = require("../calendar/entities/event.entity");
const file_entity_1 = require("../files/entities/file.entity");
let HomeworkService = class HomeworkService {
    constructor(homeworkRepository, eventsRepository, filesRepository) {
        this.homeworkRepository = homeworkRepository;
        this.eventsRepository = eventsRepository;
        this.filesRepository = filesRepository;
    }
    getEventStartUtc(event) {
        if (!event?.date || !event?.time)
            return null;
        const [y, m, d] = event.date.split("-").map(Number);
        if (!y || !m || !d)
            return null;
        const timeStr = event.time;
        let hour24 = 0;
        let minute = 0;
        if (timeStr.includes("AM") || timeStr.includes("PM")) {
            const [timePart, period] = timeStr.split(" ");
            const [hours, minutes] = timePart.split(":");
            hour24 = parseInt(hours);
            if (period === "PM" && hour24 !== 12) {
                hour24 += 12;
            }
            else if (period === "AM" && hour24 === 12) {
                hour24 = 0;
            }
            minute = parseInt(minutes);
        }
        else {
            const [hours, minutes] = timeStr.split(":");
            hour24 = parseInt(hours);
            minute = parseInt(minutes);
        }
        if (Number.isNaN(hour24) || Number.isNaN(minute))
            return null;
        const offsetMinutes = Number(event.timezoneOffsetMinutes || 0);
        const utcMs = Date.UTC(y, m - 1, d, hour24, minute, 0, 0) +
            offsetMinutes * 60_000;
        return new Date(utcMs);
    }
    async findAll(userId, role) {
        if (role === "tutor") {
            await this.checkAndCreateHWDrafts(userId);
        }
        const where = role === "tutor" ? { tutorId: userId } : { studentId: userId };
        return this.homeworkRepository.find({
            where,
            relations: ["student", "tutor", "files", "lesson"],
            order: { createdAt: "DESC" },
        });
    }
    async checkAndCreateHWDrafts(tutorId) {
        const now = new Date();
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const nowStr = `${year}-${month}-${day}`;
        const potentialEvents = await this.eventsRepository.find({
            where: [
                { tutorId, date: (0, typeorm_2.LessThan)(nowStr) },
                { tutorId, date: nowStr },
            ],
            relations: ["student"],
        });
        for (const event of potentialEvents) {
            const eventStartUtc = this.getEventStartUtc(event);
            if (!eventStartUtc)
                continue;
            if (eventStartUtc <= now) {
                const existingHW = await this.homeworkRepository.findOne({
                    where: { lessonId: event.id },
                });
                if (!existingHW) {
                    const draft = this.homeworkRepository.create({
                        lessonId: event.id,
                        tutorId: event.tutorId,
                        studentId: event.studentId,
                        subject: event.subject || event.title,
                        status: "draft",
                        createdAt: new Date(),
                    });
                    await this.homeworkRepository.save(draft);
                }
            }
        }
    }
    async create(createDto, tutorId) {
        let dueDate = createDto.dueDate;
        if (dueDate === "next_lesson" && createDto.studentId) {
            const nowStr = new Date().toISOString().split("T")[0];
            let query = this.eventsRepository
                .createQueryBuilder("event")
                .where("event.studentId = :studentId", {
                studentId: createDto.studentId,
            });
            if (createDto.lessonId) {
                const currentLesson = await this.eventsRepository.findOne({
                    where: { id: createDto.lessonId },
                });
                if (currentLesson) {
                    query = query.andWhere("event.date > :date", {
                        date: currentLesson.date,
                    });
                }
                else {
                    query = query.andWhere("event.date > :nowStr", { nowStr });
                }
            }
            else {
                query = query.andWhere("event.date > :nowStr", { nowStr });
            }
            const nextLesson = await query.orderBy("event.date", "ASC").getOne();
            if (nextLesson) {
                dueDate = nextLesson.date;
            }
            else {
                dueDate = null;
            }
        }
        if (createDto.lessonId) {
            const existingDraft = await this.homeworkRepository.findOne({
                where: { lessonId: createDto.lessonId, status: "draft" },
            });
            if (existingDraft) {
                Object.assign(existingDraft, {
                    ...createDto,
                    dueDate,
                    status: "pending",
                    createdAt: new Date(),
                });
                return this.homeworkRepository.save(existingDraft);
            }
        }
        const homework = this.homeworkRepository.create({
            ...createDto,
            dueDate,
            tutorId,
            status: createDto.status || "pending",
        });
        return this.homeworkRepository.save(homework);
    }
    async update(id, updateDto, userId, role) {
        const homework = await this.homeworkRepository.findOne({
            where: { id },
            relations: ["tutor", "student"],
        });
        if (!homework) {
            throw new common_1.BadRequestException("Homework not found");
        }
        if (role === "tutor" && homework.tutorId !== userId) {
            throw new common_1.ForbiddenException("Not your homework");
        }
        if (role === "student" && homework.studentId !== userId) {
            throw new common_1.ForbiddenException("Not your homework");
        }
        if (updateDto.question && updateDto.question !== homework.question) {
            homework.hasNewQuestion = true;
        }
        if (updateDto.questionAnswer &&
            updateDto.questionAnswer !== homework.questionAnswer) {
            homework.hasNewAnswer = true;
            homework.hasNewQuestion = false;
        }
        if (updateDto.status === "completed") {
            homework.status = "completed";
        }
        Object.assign(homework, updateDto);
        return this.homeworkRepository.save(homework);
    }
    async findOne(id, userId, role) {
        const homework = await this.homeworkRepository.findOne({
            where: { id },
            relations: ["student", "tutor", "files", "lesson"],
        });
        if (!homework) {
            throw new common_1.BadRequestException("Homework not found");
        }
        if (role === "tutor" && homework.tutorId !== userId) {
            throw new common_1.ForbiddenException("Not your homework");
        }
        if (role === "student" && homework.studentId !== userId) {
            throw new common_1.ForbiddenException("Not your homework");
        }
        if (role === "tutor" && homework.hasNewQuestion) {
            homework.hasNewQuestion = false;
            await this.homeworkRepository.save(homework);
        }
        if (role === "student" && homework.hasNewAnswer) {
            homework.hasNewAnswer = false;
            await this.homeworkRepository.save(homework);
        }
        return homework;
    }
    async delete(id, tutorId) {
        const homework = await this.homeworkRepository.findOne({
            where: { id, tutorId },
        });
        if (!homework) {
            throw new common_1.BadRequestException("Homework not found or not yours");
        }
        return this.homeworkRepository.remove(homework);
    }
};
exports.HomeworkService = HomeworkService;
exports.HomeworkService = HomeworkService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(homework_entity_1.Homework)),
    __param(1, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(2, (0, typeorm_1.InjectRepository)(file_entity_1.FileEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], HomeworkService);
//# sourceMappingURL=homework.service.js.map
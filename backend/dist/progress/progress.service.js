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
const calendar_service_1 = require("../calendar/calendar.service");
const homework_service_1 = require("../homework/homework.service");
let ProgressService = class ProgressService {
    constructor(progressRepository, connectionsService, calendarService, homeworkService) {
        this.progressRepository = progressRepository;
        this.connectionsService = connectionsService;
        this.calendarService = calendarService;
        this.homeworkService = homeworkService;
    }
    async create(createProgressDto) {
        const connections = await this.connectionsService.getConnections(createProgressDto.tutorId, "tutor");
        const isConnected = connections.some((c) => c.studentId === createProgressDto.studentId);
        if (!isConnected) {
            throw new common_1.BadRequestException("Can only track progress for connected students");
        }
        const progress = this.progressRepository.create(createProgressDto);
        const saved = await this.progressRepository.save(progress);
        return Array.isArray(saved) ? saved[0] : saved;
    }
    async findAll(userId, userRole) {
        if (userRole === "tutor") {
            const connections = await this.connectionsService.getConnections(userId, "tutor");
            const connectedStudentIds = connections.map((c) => c.studentId);
            if (connectedStudentIds.length === 0) {
                return [];
            }
            return this.progressRepository
                .createQueryBuilder("progress")
                .leftJoinAndSelect("progress.student", "student")
                .where("progress.tutorId = :tutorId", { tutorId: userId })
                .andWhere("progress.studentId IN (:...studentIds)", {
                studentIds: connectedStudentIds,
            })
                .orderBy("progress.createdAt", "DESC")
                .getMany();
        }
        else {
            const connections = await this.connectionsService.getConnections(userId, "student");
            const connectedTutorIds = connections.map((c) => c.tutorId);
            if (connectedTutorIds.length === 0) {
                return [];
            }
            return this.progressRepository
                .createQueryBuilder("progress")
                .leftJoinAndSelect("progress.tutor", "tutor")
                .where("progress.studentId = :studentId", { studentId: userId })
                .andWhere("progress.tutorId IN (:...tutorIds)", {
                tutorIds: connectedTutorIds,
            })
                .orderBy("progress.createdAt", "DESC")
                .getMany();
        }
    }
    async getOverallStats(userId, userRole) {
        if (userRole === "student") {
            return this.getStudentDashboardStats(userId);
        }
        const progress = await this.findAll(userId, userRole);
        if (progress.length === 0) {
            return { overallProgress: 0, totalHours: 0 };
        }
        const overallProgress = progress.reduce((sum, p) => sum + Number(p.progress), 0) /
            progress.length;
        const totalHours = progress.reduce((sum, p) => sum + Number(p.hoursStudied), 0);
        return {
            overallProgress: Math.round(overallProgress),
            totalHours: Math.round(totalHours),
        };
    }
    async getStudentDashboardStats(studentId) {
        const connections = await this.connectionsService.getConnections(studentId, "student");
        const allEvents = await this.calendarService.findAll(studentId, "student");
        const now = new Date();
        const currentDay = now.getDay();
        const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diffToMonday);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        const weekEvents = allEvents.filter((e) => {
            const eventDate = new Date(e.date);
            return eventDate >= weekStart && eventDate <= weekEnd;
        });
        const completedWeekEvents = weekEvents.filter((e) => {
            const d = new Date(e.date + "T" + e.time);
            return d < now;
        });
        const weeklyAttendance = weekEvents.length > 0
            ? Math.round((completedWeekEvents.length / weekEvents.length) * 100)
            : 0;
        const weeklyHours = completedWeekEvents.reduce((acc, e) => acc + (Number(e.duration) || 60), 0) / 60;
        const totalCompletedEvents = allEvents.filter((e) => {
            const d = new Date(e.date + "T" + e.time);
            return d < now;
        });
        const totalHours = totalCompletedEvents.reduce((acc, e) => acc + (Number(e.duration) || 60), 0) / 60;
        const weeklyActivity = [];
        const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + i);
            const dayStr = dayDate.toISOString().split("T")[0];
            const dayEvents = weekEvents.filter((e) => e.date === dayStr);
            const hours = dayEvents.reduce((acc, e) => acc + (Number(e.duration) || 60), 0) / 60;
            weeklyActivity.push({
                day: days[i],
                hours: Number(hours.toFixed(1)),
            });
        }
        const subjects = connections.map((conn) => {
            const tutorEvents = allEvents.filter((e) => e.tutorId === conn.tutorId);
            const tutorCompleted = tutorEvents.filter((e) => {
                const d = new Date(e.date + "T" + e.time);
                return d < now;
            });
            const subjectHours = tutorCompleted.reduce((acc, e) => acc + (Number(e.duration) || 60), 0) /
                60;
            const lessonsCompleted = tutorCompleted.length;
            const totalScheduled = tutorEvents.length;
            const subjectProgress = totalScheduled > 0
                ? Math.round((lessonsCompleted / totalScheduled) * 100)
                : 0;
            const colors = ["#1db954", "#2e77d0", "#af2896", "#e8115b"];
            const color = colors[conn.tutorId % colors.length];
            return {
                id: conn.tutorId,
                name: conn.defaultSubject || "Общий",
                tutorName: conn.tutor.name,
                progress: subjectProgress,
                grade: "N/A",
                hoursStudied: Math.round(subjectHours),
                lessonsCompleted,
                color: color,
            };
        });
        return {
            weeklyAttendance,
            weeklyHours: Math.round(weeklyHours),
            totalHours: Math.round(totalHours),
            weeklyActivity,
            subjects,
        };
    }
    async getSubjectHistory(studentId, tutorId) {
        const allEvents = await this.calendarService.findAll(studentId, "student");
        const studentEvents = allEvents
            .filter((e) => e.tutorId === tutorId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() ||
            b.time.localeCompare(a.time));
        const now = new Date();
        const pastLessons = studentEvents.filter((e) => {
            const eventDate = e.date.split("T")[0];
            const timeParts = e.time.split(":");
            const h = timeParts[0].padStart(2, "0");
            const m = timeParts[1]
                ? timeParts[1].split(" ")[0].padStart(2, "0")
                : "00";
            const lessonDateTime = new Date(`${eventDate}T${h}:${m}:00`);
            return lessonDateTime < now;
        });
        const upcomingLessons = studentEvents
            .filter((e) => {
            const eventDate = e.date.split("T")[0];
            const timeParts = e.time.split(":");
            const h = timeParts[0].padStart(2, "0");
            const m = timeParts[1]
                ? timeParts[1].split(" ")[0].padStart(2, "0")
                : "00";
            const lessonDateTime = new Date(`${eventDate}T${h}:${m}:00`);
            return lessonDateTime >= now;
        })
            .sort((a, b) => {
            const dateA = new Date(a.date + "T" + a.time);
            const dateB = new Date(b.date + "T" + b.time);
            return dateA.getTime() - dateB.getTime();
        });
        const allHomework = await this.homeworkService.findAll(studentId, "student");
        const studentHomework = allHomework.filter((h) => h.tutorId === tutorId && h.status !== "draft");
        const homeworkByLessonId = new Map();
        const orphanHomework = [];
        studentHomework.forEach((h) => {
            if (h.lessonId) {
                if (!homeworkByLessonId.has(h.lessonId)) {
                    homeworkByLessonId.set(h.lessonId, []);
                }
                homeworkByLessonId.get(h.lessonId).push(h);
            }
            else {
                orphanHomework.push(h);
            }
        });
        const upcomingLesson = upcomingLessons.length > 0
            ? {
                ...upcomingLessons[0],
                homework: homeworkByLessonId.get(upcomingLessons[0].id) || [],
            }
            : null;
        const history = pastLessons.map((l) => ({
            ...l,
            type: "lesson",
            homework: homeworkByLessonId.get(l.id) || [],
        }));
        const fullHistory = [
            ...history,
            ...orphanHomework.map((h) => ({
                ...h,
                type: "homework",
                date: h.createdAt,
            })),
        ].sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt).getTime();
            const dateB = new Date(b.date || b.createdAt).getTime();
            return dateB - dateA;
        });
        const activeHW = studentHomework.filter((h) => h.status === "pending").length;
        const missedHW = studentHomework.filter((h) => h.status === "missed").length;
        const completedHW = studentHomework.filter((h) => h.status === "completed").length;
        return {
            lessonsCount: pastLessons.length,
            activeHomework: activeHW,
            missedHomework: missedHW,
            completedHomework: completedHW,
            upcomingLesson,
            history: fullHistory,
            tutorId,
        };
    }
};
exports.ProgressService = ProgressService;
exports.ProgressService = ProgressService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(progress_entity_1.Progress)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => connections_service_1.ConnectionsService))),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => calendar_service_1.CalendarService))),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => homework_service_1.HomeworkService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        connections_service_1.ConnectionsService,
        calendar_service_1.CalendarService,
        homework_service_1.HomeworkService])
], ProgressService);
//# sourceMappingURL=progress.service.js.map
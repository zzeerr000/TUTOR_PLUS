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
exports.CalendarController = void 0;
const common_1 = require("@nestjs/common");
const calendar_service_1 = require("./calendar.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const finance_service_1 = require("../finance/finance.service");
let CalendarController = class CalendarController {
    constructor(calendarService, financeService) {
        this.calendarService = calendarService;
        this.financeService = financeService;
    }
    findAll(req) {
        return this.calendarService.findAll(req.user.sub, req.user.role);
    }
    async create(createEventDto, req) {
        const tutorId = req.user.role === "tutor" ? req.user.sub : createEventDto.tutorId;
        const studentId = req.user.role === "student" ? req.user.sub : createEventDto.studentId;
        await this.calendarService.verifyConnection(tutorId, studentId);
        return this.calendarService.create({
            ...createEventDto,
            tutorId,
            studentId,
        });
    }
    async update(id, updateEventDto, req) {
        const tutorId = req.user.role === "tutor" ? req.user.sub : updateEventDto.tutorId;
        const studentId = req.user.role === "student" ? req.user.sub : updateEventDto.studentId;
        await this.calendarService.verifyConnection(tutorId, studentId);
        const event = await this.calendarService.findOne(id);
        if (event && event.tutorId !== req.user.sub && req.user.role === "tutor") {
            throw new common_1.ForbiddenException("You can only edit your own lessons");
        }
        return this.calendarService.update(id, {
            ...updateEventDto,
            tutorId,
            studentId,
        });
    }
    async remove(id, recurring, req) {
        if (req.user.role !== "tutor") {
            throw new common_1.ForbiddenException("Only tutors can delete lessons");
        }
        const event = await this.calendarService.findOne(+id);
        if (!event) {
            return { message: "Event already deleted" };
        }
        if (event.tutorId !== req.user.sub) {
            throw new common_1.ForbiddenException("You can only delete your own lessons");
        }
        if (recurring === "true") {
            await this.calendarService.removeRecurring(+id);
            return { message: "Recurring events deleted successfully" };
        }
        else {
            await this.calendarService.remove(+id);
            return { message: "Event deleted successfully" };
        }
    }
};
exports.CalendarController = CalendarController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CalendarController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id", common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("recurring")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CalendarController.prototype, "remove", null);
exports.CalendarController = CalendarController = __decorate([
    (0, common_1.Controller)("calendar"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => finance_service_1.FinanceService))),
    __metadata("design:paramtypes", [calendar_service_1.CalendarService,
        finance_service_1.FinanceService])
], CalendarController);
//# sourceMappingURL=calendar.controller.js.map
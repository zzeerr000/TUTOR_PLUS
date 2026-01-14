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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const finance_service_1 = require("./finance.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let FinanceController = class FinanceController {
    constructor(financeService) {
        this.financeService = financeService;
    }
    findAll(req) {
        return this.financeService.findAll(req.user.sub, req.user.role);
    }
    getStats(req) {
        return this.financeService.getStats(req.user.sub, req.user.role);
    }
    create(createTransactionDto, req) {
        return this.financeService.create({
            ...createTransactionDto,
            tutorId: req.user.role === "tutor" ? req.user.sub : createTransactionDto.tutorId,
            studentId: req.user.role === "student"
                ? req.user.sub
                : createTransactionDto.studentId,
        });
    }
    async confirmPayment(id, req) {
        if (req.user.role !== "tutor") {
            throw new common_1.ForbiddenException("Only tutors can confirm payments");
        }
        return this.financeService.confirmPayment(id, req.user.sub);
    }
    async clearHistory(req) {
        if (req.user.role !== "tutor") {
            throw new common_1.ForbiddenException("Only tutors can clear finance history");
        }
        return this.financeService.deleteAllForTutor(req.user.sub);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("stats"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(":id/confirm"),
    __param(0, (0, common_1.Param)("id", common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.Put)("history"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "clearHistory", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)("finance"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map
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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const connections_service_1 = require("../connections/connections.service");
let UsersController = class UsersController {
    constructor(usersService, connectionsService) {
        this.usersService = usersService;
        this.connectionsService = connectionsService;
    }
    async getCode(req) {
        return { code: await this.usersService.getOrGenerateCode(req.user.sub) };
    }
    async getStudents(req) {
        if (req.user.role !== 'tutor') {
            return [];
        }
        const connections = await this.connectionsService.getConnections(req.user.sub, req.user.role);
        return connections.map(c => c.student);
    }
    async createStudent(createStudentDto, req) {
        if (req.user.role !== 'tutor') {
            throw new common_1.ForbiddenException('Only tutors can create students');
        }
        return this.usersService.create(createStudentDto.email, createStudentDto.password, createStudentDto.name, 'student');
    }
    async updateName(body, req) {
        return this.usersService.updateName(req.user.sub, body.name);
    }
    async deleteAccount(req) {
        await this.usersService.deleteAccount(req.user.sub);
        return { message: 'Account deleted successfully' };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('code'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getCode", null);
__decorate([
    (0, common_1.Get)('students'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getStudents", null);
__decorate([
    (0, common_1.Post)('students'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createStudent", null);
__decorate([
    (0, common_1.Put)('profile/name'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateName", null);
__decorate([
    (0, common_1.Delete)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAccount", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => connections_service_1.ConnectionsService))),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        connections_service_1.ConnectionsService])
], UsersController);
//# sourceMappingURL=users.controller.js.map
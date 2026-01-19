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
exports.ConnectionsController = void 0;
const common_1 = require("@nestjs/common");
const connections_service_1 = require("./connections.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ConnectionsController = class ConnectionsController {
    constructor(connectionsService) {
        this.connectionsService = connectionsService;
    }
    createRequest(body, req) {
        return this.connectionsService.createConnectionRequest(req.user.sub, body.code);
    }
    getPendingRequests(req) {
        return this.connectionsService.getPendingRequests(req.user.sub, req.user.role);
    }
    getConnections(req) {
        return this.connectionsService.getConnections(req.user.sub, req.user.role);
    }
    approveConnection(id, body, req) {
        return this.connectionsService.approveConnection(id, req.user.sub, body.existingStudentId);
    }
    createManualStudent(body, req) {
        return this.connectionsService.createManualStudent(req.user.sub, body.name, body.defaultSubject, body.defaultPrice, body.defaultDuration);
    }
    linkVirtualStudent(body, req) {
        return this.connectionsService.linkVirtualStudentByCode(req.user.sub, body.virtualStudentId, body.studentCode);
    }
    updateAlias(studentId, body, req) {
        return this.connectionsService.updateStudentAlias(req.user.sub, studentId, body);
    }
    rejectConnection(id, req) {
        return this.connectionsService.rejectConnection(id, req.user.sub);
    }
    removeStudent(studentId, req) {
        return this.connectionsService.removeStudent(req.user.sub, studentId);
    }
};
exports.ConnectionsController = ConnectionsController;
__decorate([
    (0, common_1.Post)("request"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)("pending"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "getPendingRequests", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "getConnections", null);
__decorate([
    (0, common_1.Post)(":id/approve"),
    __param(0, (0, common_1.Param)("id", common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "approveConnection", null);
__decorate([
    (0, common_1.Post)("manual"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "createManualStudent", null);
__decorate([
    (0, common_1.Post)("link-virtual"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "linkVirtualStudent", null);
__decorate([
    (0, common_1.Post)(":studentId/alias"),
    __param(0, (0, common_1.Param)("studentId", common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "updateAlias", null);
__decorate([
    (0, common_1.Post)(":id/reject"),
    __param(0, (0, common_1.Param)("id", common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "rejectConnection", null);
__decorate([
    (0, common_1.Post)(":studentId/delete"),
    __param(0, (0, common_1.Param)("studentId", common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ConnectionsController.prototype, "removeStudent", null);
exports.ConnectionsController = ConnectionsController = __decorate([
    (0, common_1.Controller)("connections"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [connections_service_1.ConnectionsService])
], ConnectionsController);
//# sourceMappingURL=connections.controller.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const connections_controller_1 = require("./connections.controller");
const connections_service_1 = require("./connections.service");
const connection_entity_1 = require("./entities/connection.entity");
const users_module_1 = require("../users/users.module");
let ConnectionsModule = class ConnectionsModule {
};
exports.ConnectionsModule = ConnectionsModule;
exports.ConnectionsModule = ConnectionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([connection_entity_1.Connection]),
            (0, common_1.forwardRef)(() => users_module_1.UsersModule),
        ],
        controllers: [connections_controller_1.ConnectionsController],
        providers: [connections_service_1.ConnectionsService],
        exports: [connections_service_1.ConnectionsService],
    })
], ConnectionsModule);
//# sourceMappingURL=connections.module.js.map
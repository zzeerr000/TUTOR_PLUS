"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const progress_service_1 = require("./progress.service");
const progress_controller_1 = require("./progress.controller");
const progress_entity_1 = require("./entities/progress.entity");
const connections_module_1 = require("../connections/connections.module");
let ProgressModule = class ProgressModule {
};
exports.ProgressModule = ProgressModule;
exports.ProgressModule = ProgressModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([progress_entity_1.Progress]),
            (0, common_1.forwardRef)(() => connections_module_1.ConnectionsModule),
        ],
        controllers: [progress_controller_1.ProgressController],
        providers: [progress_service_1.ProgressService],
        exports: [progress_service_1.ProgressService],
    })
], ProgressModule);
//# sourceMappingURL=progress.module.js.map
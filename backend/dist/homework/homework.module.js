"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeworkModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const homework_controller_1 = require("./homework.controller");
const homework_service_1 = require("./homework.service");
const homework_entity_1 = require("./entities/homework.entity");
const event_entity_1 = require("../calendar/entities/event.entity");
const file_entity_1 = require("../files/entities/file.entity");
let HomeworkModule = class HomeworkModule {
};
exports.HomeworkModule = HomeworkModule;
exports.HomeworkModule = HomeworkModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([homework_entity_1.Homework, event_entity_1.Event, file_entity_1.FileEntity]),
        ],
        controllers: [homework_controller_1.HomeworkController],
        providers: [homework_service_1.HomeworkService],
        exports: [homework_service_1.HomeworkService],
    })
], HomeworkModule);
//# sourceMappingURL=homework.module.js.map
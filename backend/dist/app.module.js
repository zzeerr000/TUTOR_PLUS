"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const tasks_module_1 = require("./tasks/tasks.module");
const messages_module_1 = require("./messages/messages.module");
const files_module_1 = require("./files/files.module");
const finance_module_1 = require("./finance/finance.module");
const calendar_module_1 = require("./calendar/calendar.module");
const progress_module_1 = require("./progress/progress.module");
const connections_module_1 = require("./connections/connections.module");
const app_controller_1 = require("./app.controller");
const user_entity_1 = require("./users/entities/user.entity");
const task_entity_1 = require("./tasks/entities/task.entity");
const message_entity_1 = require("./messages/entities/message.entity");
const file_entity_1 = require("./files/entities/file.entity");
const transaction_entity_1 = require("./finance/entities/transaction.entity");
const event_entity_1 = require("./calendar/entities/event.entity");
const progress_entity_1 = require("./progress/entities/progress.entity");
const connection_entity_1 = require("./connections/entities/connection.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'sqlite',
                database: 'tutorplus.db',
                entities: [user_entity_1.User, task_entity_1.Task, message_entity_1.Message, file_entity_1.FileEntity, transaction_entity_1.Transaction, event_entity_1.Event, progress_entity_1.Progress, connection_entity_1.Connection],
                synchronize: true,
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tasks_module_1.TasksModule,
            messages_module_1.MessagesModule,
            files_module_1.FilesModule,
            finance_module_1.FinanceModule,
            calendar_module_1.CalendarModule,
            progress_module_1.ProgressModule,
            connections_module_1.ConnectionsModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
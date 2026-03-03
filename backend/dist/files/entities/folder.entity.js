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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const file_entity_1 = require("./file.entity");
const subject_entity_1 = require("../../subjects/entities/subject.entity");
let FolderEntity = class FolderEntity {
};
exports.FolderEntity = FolderEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FolderEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FolderEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], FolderEntity.prototype, "uploadedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "uploadedById" }),
    __metadata("design:type", user_entity_1.User)
], FolderEntity.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], FolderEntity.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => FolderEntity, (folder) => folder.subfolders, {
        nullable: true,
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "parentId" }),
    __metadata("design:type", FolderEntity)
], FolderEntity.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => FolderEntity, (folder) => folder.parent),
    __metadata("design:type", Array)
], FolderEntity.prototype, "subfolders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => file_entity_1.FileEntity, (file) => file.folder),
    __metadata("design:type", Array)
], FolderEntity.prototype, "files", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], FolderEntity.prototype, "subjectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => subject_entity_1.Subject, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "subjectId" }),
    __metadata("design:type", subject_entity_1.Subject)
], FolderEntity.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FolderEntity.prototype, "createdAt", void 0);
exports.FolderEntity = FolderEntity = __decorate([
    (0, typeorm_1.Entity)("folders")
], FolderEntity);
//# sourceMappingURL=folder.entity.js.map
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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const bcrypt = require("bcryptjs");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    generateCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    async create(email, password, name, role) {
        const existingUser = await this.findByEmailAndRole(email, role);
        if (existingUser) {
            throw new common_1.ConflictException(`Account with email ${email} as ${role} already exists`);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        let code;
        let existingCodeUser;
        do {
            code = this.generateCode();
            existingCodeUser = await this.usersRepository.findOne({ where: { code } });
        } while (existingCodeUser);
        try {
            const user = this.usersRepository.create({
                email,
                password: hashedPassword,
                name,
                role: role,
                code,
            });
            return await this.usersRepository.save(user);
        }
        catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
                throw new common_1.ConflictException(`Account with email ${email} as ${role} already exists`);
            }
            throw error;
        }
    }
    async getOrGenerateCode(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.code) {
            return user.code;
        }
        let code;
        let existingUser;
        do {
            code = this.generateCode();
            existingUser = await this.usersRepository.findOne({ where: { code } });
        } while (existingUser);
        user.code = code;
        await this.usersRepository.save(user);
        return code;
    }
    async findByCode(code) {
        return this.usersRepository.findOne({ where: { code } });
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findByEmailAndRole(email, role) {
        return this.usersRepository.findOne({ where: { email, role: role } });
    }
    async findById(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async findByRole(role) {
        return this.usersRepository.find({ where: { role: role } });
    }
    async getConnectedStudents(tutorId) {
        return this.findByRole('student');
    }
    async getConnectedTutors(studentId) {
        return this.findByRole('tutor');
    }
    async updateName(userId, name) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        user.name = name;
        return this.usersRepository.save(user);
    }
    async deleteAccount(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.usersRepository.remove(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map
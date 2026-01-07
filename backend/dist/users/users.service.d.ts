import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    private generateCode;
    create(email: string, password: string, name: string, role: string): Promise<User>;
    getOrGenerateCode(userId: number): Promise<string>;
    findByCode(code: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByEmailAndRole(email: string, role: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    findByRole(role: string): Promise<User[]>;
    getConnectedStudents(tutorId: number): Promise<User[]>;
    getConnectedTutors(studentId: number): Promise<User[]>;
    updateName(userId: number, name: string): Promise<User>;
    deleteAccount(userId: number): Promise<void>;
}

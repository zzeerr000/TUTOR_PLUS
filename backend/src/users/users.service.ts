import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async create(email: string, password: string, name: string, role: string): Promise<User> {
    // Check if user with same email and role already exists
    const existingUser = await this.findByEmailAndRole(email, role);
    if (existingUser) {
      throw new ConflictException(`Account with email ${email} as ${role} already exists`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let code: string;
    let existingCodeUser: User | null;
    
    // Generate unique code
    do {
      code = this.generateCode();
      existingCodeUser = await this.usersRepository.findOne({ where: { code } });
    } while (existingCodeUser);

    try {
      const user = this.usersRepository.create({
        email,
        password: hashedPassword,
        name,
        role: role as any,
        code,
      });
      return await this.usersRepository.save(user);
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === '23505') {
        throw new ConflictException(`Account with email ${email} as ${role} already exists`);
      }
      throw error;
    }
  }

  async getOrGenerateCode(userId: number): Promise<string> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.code) {
      return user.code;
    }

    // Generate unique code if doesn't exist
    let code: string;
    let existingUser: User | null;
    
    do {
      code = this.generateCode();
      existingUser = await this.usersRepository.findOne({ where: { code } });
    } while (existingUser);

    user.code = code;
    await this.usersRepository.save(user);
    return code;
  }

  async findByCode(code: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { code } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmailAndRole(email: string, role: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email, role: role as any } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByRole(role: string): Promise<User[]> {
    return this.usersRepository.find({ where: { role: role as any } });
  }

  async getConnectedStudents(tutorId: number): Promise<User[]> {
    // This will be used with connections - for now return all students
    // Will be updated when connections are implemented
    return this.findByRole('student');
  }

  async getConnectedTutors(studentId: number): Promise<User[]> {
    // This will be used with connections - for now return all tutors
    // Will be updated when connections are implemented
    return this.findByRole('tutor');
  }

  async updateName(userId: number, name: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.name = name;
    return this.usersRepository.save(user);
  }

  async deleteAccount(userId: number): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.remove(user);
  }
}


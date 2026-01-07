import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user with same email and role already exists
    const existingUser = await this.usersService.findByEmailAndRole(registerDto.email, registerDto.role);
    if (existingUser) {
      throw new UnauthorizedException(`Account with email ${registerDto.email} as ${registerDto.role} already exists`);
    }

    const user = await this.usersService.create(
      registerDto.email,
      registerDto.password,
      registerDto.name,
      registerDto.role,
    );

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // If role is provided, find by email and role
    // Otherwise, try to find by email (for backward compatibility)
    let user;
    if (loginDto.role) {
      user = await this.usersService.findByEmailAndRole(loginDto.email, loginDto.role);
    } else {
      user = await this.usersService.findByEmail(loginDto.email);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If role was provided but doesn't match, throw error
    if (loginDto.role && user.role !== loginDto.role) {
      throw new UnauthorizedException(`No ${loginDto.role} account found with this email`);
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}


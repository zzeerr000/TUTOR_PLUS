import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: number;
            email: string;
            name: string;
            role: import("../users/entities/user.entity").UserRole;
            code: string;
            avatarUrl: string;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            code: any;
            avatarUrl: any;
        };
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("../users/entities/user.entity").UserRole;
        code: string;
        avatarUrl: string;
    }>;
}

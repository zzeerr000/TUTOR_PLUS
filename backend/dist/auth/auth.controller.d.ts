import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    getProfile(req: any): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("../users/entities/user.entity").UserRole;
        code: string;
        avatarUrl: string;
    }>;
}

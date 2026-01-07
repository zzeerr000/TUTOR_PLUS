import { UserRole } from '../../users/entities/user.entity';
export declare class LoginDto {
    email: string;
    password: string;
    role?: UserRole;
}

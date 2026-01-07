export declare enum UserRole {
    TUTOR = "tutor",
    STUDENT = "student"
}
export declare class User {
    id: number;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    code: string;
    createdAt: Date;
}

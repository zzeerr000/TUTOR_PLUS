import { UsersService } from './users.service';
import { ConnectionsService } from '../connections/connections.service';
export declare class UsersController {
    private readonly usersService;
    private readonly connectionsService;
    constructor(usersService: UsersService, connectionsService: ConnectionsService);
    getCode(req: any): Promise<{
        code: string;
    }>;
    getStudents(req: any): Promise<import("./entities/user.entity").User[]>;
    createStudent(createStudentDto: {
        email: string;
        password: string;
        name: string;
    }, req: any): Promise<import("./entities/user.entity").User>;
    updateName(body: {
        name: string;
    }, req: any): Promise<import("./entities/user.entity").User>;
    deleteAccount(req: any): Promise<{
        message: string;
    }>;
}

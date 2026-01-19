import { Repository, DataSource } from "typeorm";
import { Connection } from "./entities/connection.entity";
import { UsersService } from "../users/users.service";
export declare class ConnectionsService {
    private connectionsRepository;
    private usersService;
    private dataSource;
    constructor(connectionsRepository: Repository<Connection>, usersService: UsersService, dataSource: DataSource);
    createConnectionRequest(requestedById: number, code: string): Promise<Connection>;
    getPendingRequests(userId: number, userRole: string): Promise<Connection[]>;
    approveConnection(connectionId: number, userId: number, existingStudentId?: number): Promise<Connection>;
    private mergeVirtualStudent;
    linkVirtualStudentByCode(tutorId: number, virtualStudentId: number, studentCode: string): Promise<Connection>;
    rejectConnection(connectionId: number, userId: number): Promise<void>;
    getConnections(userId: number, userRole: string): Promise<Connection[]>;
    createManualStudent(tutorId: number, name: string, defaultSubject?: string, defaultPrice?: number, defaultDuration?: number): Promise<Connection>;
    updateStudentAlias(tutorId: number, studentId: number, data: {
        alias?: string;
        defaultSubject?: string;
        defaultPrice?: number;
        defaultDuration?: number;
    }): Promise<Connection>;
    removeStudent(tutorId: number, studentId: number): Promise<void>;
}

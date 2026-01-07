import { Repository } from 'typeorm';
import { Connection } from './entities/connection.entity';
import { UsersService } from '../users/users.service';
export declare class ConnectionsService {
    private connectionsRepository;
    private usersService;
    constructor(connectionsRepository: Repository<Connection>, usersService: UsersService);
    createConnectionRequest(requestedById: number, code: string): Promise<Connection>;
    getPendingRequests(userId: number, userRole: string): Promise<Connection[]>;
    approveConnection(connectionId: number, userId: number): Promise<Connection>;
    rejectConnection(connectionId: number, userId: number): Promise<void>;
    getConnections(userId: number, userRole: string): Promise<Connection[]>;
}

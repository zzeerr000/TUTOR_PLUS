import { ConnectionsService } from './connections.service';
export declare class ConnectionsController {
    private readonly connectionsService;
    constructor(connectionsService: ConnectionsService);
    createRequest(body: {
        code: string;
    }, req: any): Promise<import("./entities/connection.entity").Connection>;
    getPendingRequests(req: any): Promise<import("./entities/connection.entity").Connection[]>;
    getConnections(req: any): Promise<import("./entities/connection.entity").Connection[]>;
    approveConnection(id: number, req: any): Promise<import("./entities/connection.entity").Connection>;
    rejectConnection(id: number, req: any): Promise<void>;
}

import { ConnectionsService } from "./connections.service";
export declare class ConnectionsController {
    private readonly connectionsService;
    constructor(connectionsService: ConnectionsService);
    createRequest(body: {
        code: string;
    }, req: any): Promise<import("./entities/connection.entity").Connection>;
    getPendingRequests(req: any): Promise<import("./entities/connection.entity").Connection[]>;
    getConnections(req: any): Promise<import("./entities/connection.entity").Connection[]>;
    approveConnection(id: number, body: {
        existingStudentId?: number;
    }, req: any): Promise<import("./entities/connection.entity").Connection>;
    createManualStudent(body: {
        name: string;
        defaultSubject?: string;
        defaultPrice?: number;
        defaultDuration?: number;
    }, req: any): Promise<import("./entities/connection.entity").Connection>;
    linkVirtualStudent(body: {
        virtualStudentId: number;
        studentCode: string;
    }, req: any): Promise<import("./entities/connection.entity").Connection>;
    updateAlias(studentId: number, body: {
        alias?: string;
        defaultSubject?: string;
        defaultPrice?: number;
        defaultDuration?: number;
    }, req: any): Promise<import("./entities/connection.entity").Connection>;
    rejectConnection(id: number, req: any): Promise<void>;
    removeStudent(studentId: number, req: any): Promise<void>;
}

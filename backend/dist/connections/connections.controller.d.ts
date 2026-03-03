import { ConnectionsService } from "./connections.service";
export declare class ConnectionsController {
    private readonly connectionsService;
    constructor(connectionsService: ConnectionsService);
    createRequest(body: {
        code: string;
    }, req: any): Promise<import("./entities/connection.entity").Connection>;
    getPendingRequests(req: any): Promise<import("./entities/connection.entity").Connection[]>;
    getConnections(req: any): Promise<import("./entities/connection.entity").Connection[]>;
    updateSubjects(id: number, body: {
        subjectIds: number[];
    }, req: any): Promise<import("./entities/connection.entity").Connection>;
    approveConnection(id: number, body: {
        existingStudentId?: number;
    }, req: any): Promise<import("./entities/connection.entity").Connection>;
    createManualStudent(body: {
        name: string;
        defaultSubject?: string;
        defaultPrice?: number;
        defaultDuration?: number;
        subjectIds?: number[];
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
        subjectIds?: number[];
    }, req: any): Promise<import("./entities/connection.entity").Connection>;
    rejectConnection(id: number, req: any): Promise<void>;
    deleteConnection(id: number, req: any, deleteData?: boolean): Promise<void>;
    removeStudent(studentId: number, req: any): Promise<void>;
    getStudentStats(studentId: number, req: any): Promise<{
        lessonsCount: number;
        activeHomework: number;
        missedHomework: number;
        completedHomework: number;
        lessonsHistory: import("../calendar/entities/event.entity").Event[];
        homeworkHistory: import("../homework/entities/homework.entity").Homework[];
    }>;
}

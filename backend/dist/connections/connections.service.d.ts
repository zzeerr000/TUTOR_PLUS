import { Repository, DataSource } from "typeorm";
import { Connection } from "./entities/connection.entity";
import { UsersService } from "../users/users.service";
import { CalendarService } from "../calendar/calendar.service";
import { HomeworkService } from "../homework/homework.service";
import { SubjectsService } from "../subjects/subjects.service";
import { Event } from "../calendar/entities/event.entity";
export declare class ConnectionsService {
    private connectionsRepository;
    private usersService;
    private dataSource;
    private calendarService;
    private homeworkService;
    private subjectsService;
    constructor(connectionsRepository: Repository<Connection>, usersService: UsersService, dataSource: DataSource, calendarService: CalendarService, homeworkService: HomeworkService, subjectsService: SubjectsService);
    private getEventStartUtc;
    createConnectionRequest(requestedById: number, code: string): Promise<Connection>;
    getPendingRequests(userId: number, userRole: string): Promise<Connection[]>;
    approveConnection(connectionId: number, userId: number, existingStudentId?: number): Promise<Connection>;
    private mergeVirtualStudent;
    linkVirtualStudentByCode(tutorId: number, virtualStudentId: number, studentCode: string): Promise<Connection>;
    rejectConnection(connectionId: number, userId: number): Promise<void>;
    deleteConnection(connectionId: number, userId: number, deleteData?: boolean): Promise<void>;
    getConnections(userId: number, userRole: string): Promise<Connection[]>;
    updateSubjects(connectionId: number, tutorId: number, subjectIds: number[]): Promise<Connection>;
    createManualStudent(tutorId: number, name: string, defaultSubject?: string, defaultPrice?: number, defaultDuration?: number, subjectIds?: number[]): Promise<Connection>;
    updateStudentAlias(tutorId: number, studentId: number, data: {
        alias?: string;
        defaultSubject?: string;
        defaultPrice?: number;
        defaultDuration?: number;
        subjectIds?: number[];
    }): Promise<Connection>;
    removeStudent(tutorId: number, studentId: number): Promise<void>;
    getStudentStats(tutorId: number, studentId: number): Promise<{
        lessonsCount: number;
        activeHomework: number;
        missedHomework: number;
        completedHomework: number;
        lessonsHistory: Event[];
        homeworkHistory: import("../homework/entities/homework.entity").Homework[];
    }>;
}

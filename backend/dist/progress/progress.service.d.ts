import { Repository } from "typeorm";
import { Progress } from "./entities/progress.entity";
import { ConnectionsService } from "../connections/connections.service";
import { CalendarService } from "../calendar/calendar.service";
import { HomeworkService } from "../homework/homework.service";
export declare class ProgressService {
    private progressRepository;
    private connectionsService;
    private calendarService;
    private homeworkService;
    constructor(progressRepository: Repository<Progress>, connectionsService: ConnectionsService, calendarService: CalendarService, homeworkService: HomeworkService);
    create(createProgressDto: any): Promise<Progress>;
    findAll(userId: number, userRole: string): Promise<Progress[]>;
    getOverallStats(userId: number, userRole: string): Promise<{
        weeklyAttendance: number;
        weeklyHours: number;
        totalHours: number;
        weeklyActivity: any[];
        subjects: {
            id: number;
            name: string;
            tutorName: string;
            progress: number;
            grade: string;
            hoursStudied: number;
            lessonsCompleted: number;
            color: string;
        }[];
    } | {
        overallProgress: number;
        totalHours: number;
    }>;
    getStudentDashboardStats(studentId: number): Promise<{
        weeklyAttendance: number;
        weeklyHours: number;
        totalHours: number;
        weeklyActivity: any[];
        subjects: {
            id: number;
            name: string;
            tutorName: string;
            progress: number;
            grade: string;
            hoursStudied: number;
            lessonsCompleted: number;
            color: string;
        }[];
    }>;
    getSubjectHistory(studentId: number, tutorId: number): Promise<{
        lessonsCount: number;
        activeHomework: number;
        missedHomework: number;
        completedHomework: number;
        upcomingLesson: {
            homework: any[];
            id: number;
            title: string;
            date: string;
            time: string;
            color: string;
            tutorId: number;
            tutor: import("../users/entities/user.entity").User;
            studentId: number;
            student: import("../users/entities/user.entity").User;
            subject: string;
            subjectId: number;
            subjectEntity: import("../subjects/entities/subject.entity").Subject;
            paymentPending: boolean;
            paymentIgnored: boolean;
            transactionId: number;
            amount: number;
            duration: number;
            notes: string;
        };
        history: any[];
        tutorId: number;
    }>;
}

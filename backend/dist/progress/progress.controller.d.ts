import { ProgressService } from './progress.service';
export declare class ProgressController {
    private readonly progressService;
    constructor(progressService: ProgressService);
    findAll(req: any): Promise<import("./entities/progress.entity").Progress[]>;
    getStats(req: any): Promise<{
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
    getSubjectHistory(tutorId: number, req: any): Promise<{
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
    create(createProgressDto: any, req: any): Promise<import("./entities/progress.entity").Progress>;
}

import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Progress } from "./entities/progress.entity";
import { ConnectionsService } from "../connections/connections.service";
import { CalendarService } from "../calendar/calendar.service";
import { HomeworkService } from "../homework/homework.service";

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionsService: ConnectionsService,
    @Inject(forwardRef(() => CalendarService))
    private calendarService: CalendarService,
    @Inject(forwardRef(() => HomeworkService))
    private homeworkService: HomeworkService,
  ) {}

  async create(createProgressDto: any): Promise<Progress> {
    // Verify connection exists
    const connections = await this.connectionsService.getConnections(
      createProgressDto.tutorId,
      "tutor",
    );
    const isConnected = connections.some(
      (c) => c.studentId === createProgressDto.studentId,
    );
    if (!isConnected) {
      throw new BadRequestException(
        "Can only track progress for connected students",
      );
    }

    const progress = this.progressRepository.create(createProgressDto);
    const saved = await this.progressRepository.save(progress);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findAll(userId: number, userRole: string) {
    if (userRole === "tutor") {
      // Get connected students
      const connections = await this.connectionsService.getConnections(
        userId,
        "tutor",
      );
      const connectedStudentIds = connections.map((c) => c.studentId);

      if (connectedStudentIds.length === 0) {
        return [];
      }

      return this.progressRepository
        .createQueryBuilder("progress")
        .leftJoinAndSelect("progress.student", "student")
        .where("progress.tutorId = :tutorId", { tutorId: userId })
        .andWhere("progress.studentId IN (:...studentIds)", {
          studentIds: connectedStudentIds,
        })
        .orderBy("progress.createdAt", "DESC")
        .getMany();
    } else {
      // For student, we now want to return calculated stats per subject instead of stored progress
      // But to keep backward compatibility or for specific use cases, we can keep this or deprecate it.
      // The new requirement says "First the student should see a list of their subjects".
      // We will implement a new method for the dashboard.

      const connections = await this.connectionsService.getConnections(
        userId,
        "student",
      );
      const connectedTutorIds = connections.map((c) => c.tutorId);

      if (connectedTutorIds.length === 0) {
        return [];
      }

      return this.progressRepository
        .createQueryBuilder("progress")
        .leftJoinAndSelect("progress.tutor", "tutor")
        .where("progress.studentId = :studentId", { studentId: userId })
        .andWhere("progress.tutorId IN (:...tutorIds)", {
          tutorIds: connectedTutorIds,
        })
        .orderBy("progress.createdAt", "DESC")
        .getMany();
    }
  }

  async getOverallStats(userId: number, userRole: string) {
    if (userRole === "student") {
      // New logic for student
      return this.getStudentDashboardStats(userId);
    }

    const progress = await this.findAll(userId, userRole);
    if (progress.length === 0) {
      return { overallProgress: 0, totalHours: 0 };
    }
    const overallProgress =
      progress.reduce((sum, p) => sum + Number(p.progress), 0) /
      progress.length;
    const totalHours = progress.reduce(
      (sum, p) => sum + Number(p.hoursStudied),
      0,
    );
    return {
      overallProgress: Math.round(overallProgress),
      totalHours: Math.round(totalHours),
    };
  }

  async getStudentDashboardStats(studentId: number) {
    const connections = await this.connectionsService.getConnections(
      studentId,
      "student",
    );
    const allEvents = await this.calendarService.findAll(studentId, "student");

    // Calculate weekly stats
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Weekly Events
    const weekEvents = allEvents.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    const completedWeekEvents = weekEvents.filter((e) => {
      const d = new Date(e.date + "T" + e.time);
      return d < now;
    });

    // Attendance: Completed / Total Scheduled this week
    // If no scheduled events, attendance is 100% (or 0%? Let's say 100 to be nice, or N/A)
    const weeklyAttendance =
      weekEvents.length > 0
        ? Math.round((completedWeekEvents.length / weekEvents.length) * 100)
        : 0;

    const weeklyHours =
      completedWeekEvents.reduce(
        (acc, e) => acc + (Number(e.duration) || 60),
        0,
      ) / 60;

    // Total Hours (All time)
    const totalCompletedEvents = allEvents.filter((e) => {
      const d = new Date(e.date + "T" + e.time);
      return d < now;
    });
    const totalHours =
      totalCompletedEvents.reduce(
        (acc, e) => acc + (Number(e.duration) || 60),
        0,
      ) / 60;

    // Weekly Activity (last 7 days of current week, Mon-Sun)
    const weeklyActivity = [];
    const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dayStr = dayDate.toISOString().split("T")[0]; // YYYY-MM-DD

      const dayEvents = weekEvents.filter((e) => e.date === dayStr);
      const hours =
        dayEvents.reduce((acc, e) => acc + (Number(e.duration) || 60), 0) / 60;

      weeklyActivity.push({
        day: days[i],
        hours: Number(hours.toFixed(1)),
      });
    }

    // Subjects List with Stats
    const subjects = connections.map((conn) => {
      const tutorEvents = allEvents.filter((e) => e.tutorId === conn.tutorId);

      const tutorCompleted = tutorEvents.filter((e) => {
        const d = new Date(e.date + "T" + e.time);
        return d < now;
      });

      const subjectHours =
        tutorCompleted.reduce((acc, e) => acc + (Number(e.duration) || 60), 0) /
        60;
      const lessonsCompleted = tutorCompleted.length;

      // Subject Progress (maybe total attendance?)
      const totalScheduled = tutorEvents.length;
      const subjectProgress =
        totalScheduled > 0
          ? Math.round((lessonsCompleted / totalScheduled) * 100)
          : 0;

      // Assign colors cyclically
      const colors = ["#1db954", "#2e77d0", "#af2896", "#e8115b"];
      const color = colors[conn.tutorId % colors.length];

      return {
        id: conn.tutorId, // Use tutorId as key for drilling down
        name: conn.defaultSubject || "Общий", // Or conn.tutor.name
        tutorName: conn.tutor.name,
        progress: subjectProgress,
        grade: "N/A",
        hoursStudied: Math.round(subjectHours),
        lessonsCompleted,
        color: color,
      };
    });

    return {
      weeklyAttendance,
      weeklyHours: Math.round(weeklyHours),
      totalHours: Math.round(totalHours),
      weeklyActivity,
      subjects,
    };
  }

  async getSubjectHistory(studentId: number, tutorId: number) {
    // This reuses logic similar to ConnectionsService.getStudentStats but for student role
    const allEvents = await this.calendarService.findAll(studentId, "student");
    const studentEvents = allEvents
      .filter((e) => e.tutorId === tutorId)
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          b.time.localeCompare(a.time),
      );

    const now = new Date();

    const pastLessons = studentEvents.filter((e) => {
      const eventDate = e.date.split("T")[0];
      const timeParts = e.time.split(":");
      const h = timeParts[0].padStart(2, "0");
      const m = timeParts[1]
        ? timeParts[1].split(" ")[0].padStart(2, "0")
        : "00";
      const lessonDateTime = new Date(`${eventDate}T${h}:${m}:00`);
      return lessonDateTime < now;
    });

    const upcomingLessons = studentEvents
      .filter((e) => {
        const eventDate = e.date.split("T")[0];
        const timeParts = e.time.split(":");
        const h = timeParts[0].padStart(2, "0");
        const m = timeParts[1]
          ? timeParts[1].split(" ")[0].padStart(2, "0")
          : "00";
        const lessonDateTime = new Date(`${eventDate}T${h}:${m}:00`);
        return lessonDateTime >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date + "T" + a.time);
        const dateB = new Date(b.date + "T" + b.time);
        return dateA.getTime() - dateB.getTime();
      });

    const allHomework = await this.homeworkService.findAll(
      studentId,
      "student",
    );
    const studentHomework = allHomework.filter(
      (h) => h.tutorId === tutorId && h.status !== "draft",
    );

    const homeworkByLessonId = new Map<number, any[]>();
    const orphanHomework: any[] = [];

    studentHomework.forEach((h) => {
      if (h.lessonId) {
        if (!homeworkByLessonId.has(h.lessonId)) {
          homeworkByLessonId.set(h.lessonId, []);
        }
        homeworkByLessonId.get(h.lessonId).push(h);
      } else {
        orphanHomework.push(h);
      }
    });

    const upcomingLesson =
      upcomingLessons.length > 0
        ? {
            ...upcomingLessons[0],
            homework: homeworkByLessonId.get(upcomingLessons[0].id) || [],
          }
        : null;

    const history = pastLessons.map((l) => ({
      ...l,
      type: "lesson",
      homework: homeworkByLessonId.get(l.id) || [],
    }));

    // Merge history with orphan homework and sort by date descending
    const fullHistory = [
      ...history,
      ...orphanHomework.map((h) => ({
        ...h,
        type: "homework",
        date: h.createdAt, // use createdAt for sorting if no lesson date
      })),
    ].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateB - dateA;
    });

    const activeHW = studentHomework.filter(
      (h) => h.status === "pending",
    ).length;
    const missedHW = studentHomework.filter(
      (h) => h.status === "missed",
    ).length;
    const completedHW = studentHomework.filter(
      (h) => h.status === "completed",
    ).length;

    return {
      lessonsCount: pastLessons.length,
      activeHomework: activeHW,
      missedHomework: missedHW,
      completedHomework: completedHW,
      upcomingLesson,
      history: fullHistory,
      tutorId,
    };
  }
}

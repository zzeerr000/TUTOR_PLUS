import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Connection, ConnectionStatus } from "./entities/connection.entity";
import { UsersService } from "../users/users.service";
import { CalendarService } from "../calendar/calendar.service";
import { HomeworkService } from "../homework/homework.service";
import { SubjectsService } from "../subjects/subjects.service";
import { Event } from "../calendar/entities/event.entity";

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection)
    private connectionsRepository: Repository<Connection>,
    private usersService: UsersService,
    private dataSource: DataSource,
    @Inject(forwardRef(() => CalendarService))
    private calendarService: CalendarService,
    private homeworkService: HomeworkService,
    @Inject(forwardRef(() => SubjectsService))
    private subjectsService: SubjectsService,
  ) {}

  private getEventStartUtc(event: Event): Date | null {
    if (!event?.date || !event?.time) return null;

    const [y, m, d] = String(event.date).split("-").map(Number);
    if (!y || !m || !d) return null;

    const timeStr = String(event.time);
    let hour24 = 0;
    let minute = 0;

    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      const [timePart, period] = timeStr.split(" ");
      const [hours, minutes] = timePart.split(":");
      hour24 = parseInt(hours, 10);
      if (period === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (period === "AM" && hour24 === 12) {
        hour24 = 0;
      }
      minute = parseInt(minutes, 10);
    } else {
      const [hours, minutes] = timeStr.split(":");
      hour24 = parseInt(hours, 10);
      minute = parseInt(minutes, 10);
    }

    if (Number.isNaN(hour24) || Number.isNaN(minute)) return null;

    const offsetMinutes = Number((event as any).timezoneOffsetMinutes || 0);
    const utcMs = Date.UTC(y, m - 1, d, hour24, minute, 0, 0) +
      offsetMinutes * 60_000;
    return new Date(utcMs);
  }

  async createConnectionRequest(
    requestedById: number,
    code: string,
  ): Promise<Connection> {
    const requester = await this.usersService.findById(requestedById);
    if (!requester) {
      throw new NotFoundException("Requester not found");
    }

    const targetUser = await this.usersService.findByCode(code);
    if (!targetUser) {
      throw new NotFoundException("User with this code not found");
    }

    if (targetUser.id === requestedById) {
      throw new BadRequestException("Cannot connect to yourself");
    }

    // Check if roles are compatible
    if (requester.role === targetUser.role) {
      throw new BadRequestException("Cannot connect to user with same role");
    }

    // Determine tutor and student
    const tutorId = requester.role === "tutor" ? requester.id : targetUser.id;
    const studentId =
      requester.role === "student" ? requester.id : targetUser.id;

    // Check if connection already exists
    const existing = await this.connectionsRepository.findOne({
      where: { tutorId, studentId },
    });

    if (existing) {
      if (existing.status === ConnectionStatus.APPROVED) {
        throw new BadRequestException("Connection already exists");
      }
      if (existing.status === ConnectionStatus.PENDING) {
        throw new BadRequestException("Connection request already pending");
      }
      // If rejected, create a new request
      existing.status = ConnectionStatus.PENDING;
      existing.requestedById = requestedById;
      return this.connectionsRepository.save(existing);
    }

    const connection = this.connectionsRepository.create({
      tutorId,
      studentId,
      status: ConnectionStatus.PENDING,
      requestedById,
    });

    return this.connectionsRepository.save(connection);
  }

  async getPendingRequests(
    userId: number,
    userRole: string,
  ): Promise<Connection[]> {
    if (userRole === "tutor") {
      // Only return requests where tutor is the recipient (not the requester)
      return this.connectionsRepository
        .createQueryBuilder("connection")
        .leftJoinAndSelect("connection.student", "student")
        .where("connection.tutorId = :tutorId", { tutorId: userId })
        .andWhere("connection.status = :status", {
          status: ConnectionStatus.PENDING,
        })
        .andWhere("connection.requestedById != :userId", { userId })
        .orderBy("connection.createdAt", "DESC")
        .getMany();
    } else {
      // Only return requests where student is the recipient (not the requester)
      return this.connectionsRepository
        .createQueryBuilder("connection")
        .leftJoinAndSelect("connection.tutor", "tutor")
        .where("connection.studentId = :studentId", { studentId: userId })
        .andWhere("connection.status = :status", {
          status: ConnectionStatus.PENDING,
        })
        .andWhere("connection.requestedById != :userId", { userId })
        .orderBy("connection.createdAt", "DESC")
        .getMany();
    }
  }

  async approveConnection(
    connectionId: number,
    userId: number,
    existingStudentId?: number,
  ): Promise<Connection> {
    const connection = await this.connectionsRepository.findOne({
      where: { id: connectionId },
      relations: ["tutor", "student"],
    });

    if (!connection) {
      throw new NotFoundException("Connection request not found");
    }

    // Verify user is the recipient (not the requester)
    const isRecipient =
      (connection.tutorId === userId && connection.requestedById !== userId) ||
      (connection.studentId === userId && connection.requestedById !== userId);

    if (!isRecipient) {
      throw new BadRequestException("You cannot approve this request");
    }

    if (existingStudentId) {
      // Link to existing profile
      await this.mergeVirtualStudent(
        userId,
        existingStudentId,
        connection.studentId,
      );
      // After merging, we can delete the virtual user if it was virtual
      const virtualUser = await this.usersService.findById(existingStudentId);
      if (virtualUser && virtualUser.isVirtual) {
        // Find the old connection and delete it
        await this.connectionsRepository.delete({
          tutorId: userId,
          studentId: existingStudentId,
        });
        await this.usersService.deleteAccount(existingStudentId);
      }
    }

    connection.status = ConnectionStatus.APPROVED;
    return this.connectionsRepository.save(connection);
  }

  private async mergeVirtualStudent(
    tutorId: number,
    virtualStudentId: number,
    realStudentId: number,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update all related tables
      await queryRunner.query(
        "UPDATE events SET studentId = ? WHERE tutorId = ? AND studentId = ?",
        [realStudentId, tutorId, virtualStudentId],
      );
      await queryRunner.query(
        "UPDATE tasks SET assignedToId = ? WHERE userId = ? AND assignedToId = ?",
        [realStudentId, tutorId, virtualStudentId],
      );
      await queryRunner.query(
        "UPDATE files SET assignedToId = ? WHERE uploadedById = ? AND assignedToId = ?",
        [realStudentId, tutorId, virtualStudentId],
      );
      await queryRunner.query(
        "UPDATE progress SET studentId = ? WHERE tutorId = ? AND studentId = ?",
        [realStudentId, tutorId, virtualStudentId],
      );
      await queryRunner.query(
        "UPDATE transactions SET studentId = ? WHERE tutorId = ? AND studentId = ?",
        [realStudentId, tutorId, virtualStudentId],
      );
      await queryRunner.query(
        "UPDATE messages SET senderId = ? WHERE receiverId = ? AND senderId = ?",
        [realStudentId, tutorId, virtualStudentId],
      );
      await queryRunner.query(
        "UPDATE messages SET receiverId = ? WHERE senderId = ? AND receiverId = ?",
        [realStudentId, tutorId, virtualStudentId],
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async linkVirtualStudentByCode(
    tutorId: number,
    virtualStudentId: number,
    studentCode: string,
  ): Promise<Connection> {
    const realStudent = await this.usersService.findByCode(studentCode);
    if (!realStudent) {
      throw new NotFoundException("Student with this code not found");
    }

    if (realStudent.role !== "student") {
      throw new BadRequestException("Code belongs to a tutor");
    }

    // Check if connection already exists
    let connection = await this.connectionsRepository.findOne({
      where: { tutorId, studentId: realStudent.id },
    });

    if (!connection) {
      connection = this.connectionsRepository.create({
        tutorId,
        studentId: realStudent.id,
        status: ConnectionStatus.APPROVED,
        requestedById: tutorId,
      });
    } else {
      connection.status = ConnectionStatus.APPROVED;
    }

    await this.mergeVirtualStudent(tutorId, virtualStudentId, realStudent.id);

    // Delete virtual student
    await this.connectionsRepository.delete({
      tutorId,
      studentId: virtualStudentId,
    });
    await this.usersService.deleteAccount(virtualStudentId);

    return this.connectionsRepository.save(connection);
  }

  async rejectConnection(connectionId: number, userId: number): Promise<void> {
    const connection = await this.connectionsRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException("Connection request not found");
    }

    // Verify user is the recipient
    const isRecipient =
      (connection.tutorId === userId && connection.requestedById !== userId) ||
      (connection.studentId === userId && connection.requestedById !== userId);

    if (!isRecipient) {
      throw new BadRequestException("You cannot reject this request");
    }

    connection.status = ConnectionStatus.REJECTED;
    await this.connectionsRepository.save(connection);
  }

  async deleteConnection(connectionId: number, userId: number, deleteData?: boolean): Promise<void> {
    const connection = await this.connectionsRepository.findOne({
      where: { id: connectionId },
    });

    if (!connection) {
      throw new NotFoundException("Connection not found");
    }

    // Verify user is part of this connection
    const isParticipant =
      connection.tutorId === userId || connection.studentId === userId;

    if (!isParticipant) {
      throw new BadRequestException("You cannot delete this connection");
    }

    // If deleteData is true, also delete related chat history and calendar events
    if (deleteData) {
      // Delete calendar events between these users
      await this.calendarService.deleteEventsBetweenUsers(
        connection.tutorId,
        connection.studentId
      );
      
      // Delete messages between these users
      // Note: Add message service dependency and deletion logic here if needed
    }

    await this.connectionsRepository.remove(connection);
  }

  async getConnections(
    userId: number,
    userRole: string,
  ): Promise<Connection[]> {
    if (userRole === "tutor") {
      return this.connectionsRepository.find({
        where: { tutorId: userId, status: ConnectionStatus.APPROVED },
        relations: ["student", "subjects"],
        order: { createdAt: "DESC" },
      });
    } else {
      return this.connectionsRepository.find({
        where: { studentId: userId, status: ConnectionStatus.APPROVED },
        relations: ["tutor", "subjects"],
        order: { createdAt: "DESC" },
      });
    }
  }

  async updateSubjects(
    connectionId: number,
    tutorId: number,
    subjectIds: number[],
  ): Promise<Connection> {
    const connection = await this.connectionsRepository.findOne({
      where: { id: connectionId, tutorId, status: ConnectionStatus.APPROVED },
      relations: ["subjects"],
    });

    if (!connection) {
      throw new NotFoundException("Connection not found");
    }

    if (subjectIds) {
      const subjects = await this.subjectsService.findByIds(subjectIds);
      connection.subjects = subjects;
    }

    return this.connectionsRepository.save(connection);
  }

  async createManualStudent(
    tutorId: number,
    name: string,
    defaultSubject?: string,
    defaultPrice?: number,
    defaultDuration?: number,
    subjectIds?: number[],
  ): Promise<Connection> {
    const student = await this.usersService.createVirtualStudent(name);

    let subjects: any[] = [];
    if (subjectIds && subjectIds.length > 0) {
      subjects = await this.subjectsService.findByIds(subjectIds);
    }

    const connection = this.connectionsRepository.create({
      tutorId,
      studentId: student.id,
      status: ConnectionStatus.APPROVED,
      requestedById: tutorId,
      defaultSubject,
      defaultPrice,
      defaultDuration,
      subjects,
    });

    return this.connectionsRepository.save(connection);
  }

  async updateStudentAlias(
    tutorId: number,
    studentId: number,
    data: {
      alias?: string;
      defaultSubject?: string;
      defaultPrice?: number;
      defaultDuration?: number;
      subjectIds?: number[];
    },
  ): Promise<Connection> {
    const connection = await this.connectionsRepository.findOne({
      where: { tutorId, studentId, status: ConnectionStatus.APPROVED },
      relations: ["subjects"],
    });

    if (!connection) {
      throw new NotFoundException("Connection not found");
    }

    if (data.alias !== undefined) connection.studentAlias = data.alias;
    if (data.defaultSubject !== undefined)
      connection.defaultSubject = data.defaultSubject;
    if (data.defaultPrice !== undefined)
      connection.defaultPrice = data.defaultPrice;
    if (data.defaultDuration !== undefined)
      connection.defaultDuration = data.defaultDuration;

    if (data.subjectIds) {
      const subjects = await this.subjectsService.findByIds(data.subjectIds);
      connection.subjects = subjects;
    }

    return this.connectionsRepository.save(connection);
  }

  async removeStudent(tutorId: number, studentId: number): Promise<void> {
    const connection = await this.connectionsRepository.findOne({
      where: { tutorId, studentId },
      relations: ["student"],
    });

    if (!connection) {
      throw new NotFoundException("Connection not found");
    }

    const isVirtual = connection.student?.isVirtual;

    // Delete the connection
    await this.connectionsRepository.remove(connection);

    // If student is virtual, delete the student account as well
    if (isVirtual) {
      await this.usersService.deleteAccount(studentId);
    }
  }

  async getStudentStats(tutorId: number, studentId: number) {
    const connection = await this.connectionsRepository.findOne({
      where: { tutorId, studentId, status: ConnectionStatus.APPROVED },
    });

    if (!connection) {
      throw new NotFoundException("Connection not found");
    }

    const allEvents = await this.calendarService.findAll(tutorId, "tutor");
    const studentEvents = allEvents
      .filter((e) => e.studentId === studentId)
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          b.time.localeCompare(a.time),
      );

    const now = new Date();

    const pastLessons = studentEvents.filter((e) => {
      const eventStartUtc = this.getEventStartUtc(e as any);
      if (!eventStartUtc) return false;
      return eventStartUtc.getTime() < now.getTime();
    });

    const upcomingLessons = studentEvents
      .filter((e) => {
        const eventStartUtc = this.getEventStartUtc(e as any);
        if (!eventStartUtc) return false;
        return eventStartUtc.getTime() >= now.getTime();
      })
      .sort(
        (a, b) => {
          const aStart = this.getEventStartUtc(a as any);
          const bStart = this.getEventStartUtc(b as any);
          if (!aStart && !bStart) return 0;
          if (!aStart) return 1;
          if (!bStart) return -1;
          return aStart.getTime() - bStart.getTime();
        },
      );

    const filteredLessonsHistory = [...upcomingLessons, ...pastLessons];

    const allHomework = await this.homeworkService.findAll(tutorId, "tutor");
    const studentHomework = allHomework.filter(
      (h) => h.studentId === studentId && h.status !== "draft",
    );

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
      lessonsHistory: filteredLessonsHistory,
      homeworkHistory: studentHomework,
    };
  }
}

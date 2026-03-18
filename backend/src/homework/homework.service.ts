import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, LessThan } from "typeorm";
import { Homework } from "./entities/homework.entity";
import { Event } from "../calendar/entities/event.entity";
import { FileEntity } from "../files/entities/file.entity";

@Injectable()
export class HomeworkService {
  constructor(
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(FileEntity)
    private filesRepository: Repository<FileEntity>,
  ) {}

  private getEventStartUtc(event: Event): Date | null {
    if (!event?.date || !event?.time) return null;

    const [y, m, d] = event.date.split("-").map(Number);
    if (!y || !m || !d) return null;

    const timeStr = event.time;
    let hour24 = 0;
    let minute = 0;

    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      const [timePart, period] = timeStr.split(" ");
      const [hours, minutes] = timePart.split(":");
      hour24 = parseInt(hours);
      if (period === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (period === "AM" && hour24 === 12) {
        hour24 = 0;
      }
      minute = parseInt(minutes);
    } else {
      const [hours, minutes] = timeStr.split(":");
      hour24 = parseInt(hours);
      minute = parseInt(minutes);
    }

    if (Number.isNaN(hour24) || Number.isNaN(minute)) return null;

    const offsetMinutes = Number((event as any).timezoneOffsetMinutes || 0);
    const utcMs = Date.UTC(y, m - 1, d, hour24, minute, 0, 0) +
      offsetMinutes * 60_000;
    return new Date(utcMs);
  }

  async findAll(userId: number, role: string) {
    // Before returning, check for past lessons that might need HW "drafts"
    if (role === "tutor") {
      await this.checkAndCreateHWDrafts(userId);
    }

    const where =
      role === "tutor" ? { tutorId: userId } : { studentId: userId };

    return this.homeworkRepository.find({
      where,
      relations: ["student", "tutor", "files", "lesson"],
      order: { createdAt: "DESC" },
    });
  }

  async checkAndCreateHWDrafts(tutorId: number) {
    const now = new Date();
    // Use local date for today comparison to match DB storage
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const nowStr = `${year}-${month}-${day}`;

    // Find all events for this tutor for today and past
    const potentialEvents = await this.eventsRepository.find({
      where: [
        { tutorId, date: LessThan(nowStr) },
        { tutorId, date: nowStr },
      ],
      relations: ["student"],
    });

    for (const event of potentialEvents) {
      const eventStartUtc = this.getEventStartUtc(event);
      if (!eventStartUtc) continue;

      // If lesson has started
      if (eventStartUtc <= now) {
        const existingHW = await this.homeworkRepository.findOne({
          where: { lessonId: event.id },
        });

        if (!existingHW) {
          const draft = this.homeworkRepository.create({
            lessonId: event.id,
            tutorId: event.tutorId,
            studentId: event.studentId,
            subject: event.subject || event.title,
            status: "draft",
            createdAt: new Date(),
          });
          await this.homeworkRepository.save(draft);
        }
      }
    }
  }

  async create(createDto: any, tutorId: number) {
    let dueDate = createDto.dueDate;

    // Find the next lesson after today for the due date
    if (dueDate === "next_lesson" && createDto.studentId) {
      const nowStr = new Date().toISOString().split("T")[0];
      let query = this.eventsRepository
        .createQueryBuilder("event")
        .where("event.studentId = :studentId", {
          studentId: createDto.studentId,
        });

      if (createDto.lessonId) {
        const currentLesson = await this.eventsRepository.findOne({
          where: { id: createDto.lessonId },
        });
        if (currentLesson) {
          query = query.andWhere("event.date > :date", {
            date: currentLesson.date,
          });
        } else {
          query = query.andWhere("event.date > :nowStr", { nowStr });
        }
      } else {
        query = query.andWhere("event.date > :nowStr", { nowStr });
      }

      const nextLesson = await query.orderBy("event.date", "ASC").getOne();

      if (nextLesson) {
        dueDate = nextLesson.date;
      } else {
        dueDate = null;
      }
    }

    // If it's a draft being converted, update the existing draft
    if (createDto.lessonId) {
      const existingDraft = await this.homeworkRepository.findOne({
        where: { lessonId: createDto.lessonId, status: "draft" },
      });
      if (existingDraft) {
        Object.assign(existingDraft, {
          ...createDto,
          dueDate,
          status: "pending",
          createdAt: new Date(), // Reset creation date to now
        });
        return this.homeworkRepository.save(existingDraft);
      }
    }

    const homework = this.homeworkRepository.create({
      ...createDto,
      dueDate,
      tutorId,
      status: createDto.status || "pending",
    });

    return this.homeworkRepository.save(homework);
  }

  async update(id: number, updateDto: any, userId: number, role: string) {
    const homework = await this.homeworkRepository.findOne({
      where: { id },
      relations: ["tutor", "student"],
    });

    if (!homework) {
      throw new BadRequestException("Homework not found");
    }

    // Authorization check
    if (role === "tutor" && homework.tutorId !== userId) {
      throw new ForbiddenException("Not your homework");
    }
    if (role === "student" && homework.studentId !== userId) {
      throw new ForbiddenException("Not your homework");
    }

    // If student is asking a question
    if (updateDto.question && updateDto.question !== homework.question) {
      homework.hasNewQuestion = true;
    }

    // If tutor is answering
    if (
      updateDto.questionAnswer &&
      updateDto.questionAnswer !== homework.questionAnswer
    ) {
      homework.hasNewAnswer = true;
      homework.hasNewQuestion = false;
    }

    // If student or tutor is completing
    if (updateDto.status === "completed") {
      homework.status = "completed";
    }

    Object.assign(homework, updateDto);
    return this.homeworkRepository.save(homework);
  }

  async findOne(id: number, userId: number, role: string) {
    const homework = await this.homeworkRepository.findOne({
      where: { id },
      relations: ["student", "tutor", "files", "lesson"],
    });

    if (!homework) {
      throw new BadRequestException("Homework not found");
    }

    if (role === "tutor" && homework.tutorId !== userId) {
      throw new ForbiddenException("Not your homework");
    }
    if (role === "student" && homework.studentId !== userId) {
      throw new ForbiddenException("Not your homework");
    }

    // Clear flags when viewed
    if (role === "tutor" && homework.hasNewQuestion) {
      homework.hasNewQuestion = false;
      await this.homeworkRepository.save(homework);
    }
    if (role === "student" && homework.hasNewAnswer) {
      homework.hasNewAnswer = false;
      await this.homeworkRepository.save(homework);
    }

    return homework;
  }

  async delete(id: number, tutorId: number) {
    const homework = await this.homeworkRepository.findOne({
      where: { id, tutorId },
    });
    if (!homework) {
      throw new BadRequestException("Homework not found or not yours");
    }
    return this.homeworkRepository.remove(homework);
  }
}

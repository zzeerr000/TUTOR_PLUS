import {
  Injectable,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Event } from "./entities/event.entity";
import { ConnectionsService } from "../connections/connections.service";
import { FinanceService } from "../finance/finance.service";
import { Homework } from "../homework/entities/homework.entity";

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionsService: ConnectionsService,
    @Inject(forwardRef(() => FinanceService))
    private financeService: FinanceService,
  ) {}

  async deleteEventsBetweenUsers(tutorId: number, studentId: number): Promise<void> {
    const events = await this.eventsRepository.find({
      where: {
        tutorId,
        studentId,
      },
    });

    await this.eventsRepository.remove(events);
  }

  async verifyConnection(tutorId: number, studentId: number): Promise<void> {
    const connections = await this.connectionsService.getConnections(
      tutorId,
      "tutor",
    );
    const isConnected = connections.some((c) => c.studentId === studentId);
    if (!isConnected) {
      throw new BadRequestException(
        "Tutor and student must be connected to schedule lessons",
      );
    }
  }

  async create(createEventDto: any): Promise<Event> {
    const event = this.eventsRepository.create(createEventDto);
    const saved = await this.eventsRepository.save(event);
    const savedEvent = Array.isArray(saved) ? saved[0] : saved;

    return this.findOne(savedEvent.id) as Promise<Event>;
  }

  async findAll(userId: number, userRole: string) {
    // Get connected users
    const connections = await this.connectionsService.getConnections(
      userId,
      userRole,
    );
    const connectedUserIds = connections.map((c) =>
      userRole === "tutor" ? c.studentId : c.tutorId,
    );

    if (connectedUserIds.length === 0) {
      return [];
    }

    if (userRole === "tutor") {
      return this.eventsRepository
        .createQueryBuilder("event")
        .leftJoinAndSelect("event.student", "student")
        .leftJoinAndSelect("event.subjectEntity", "subjectEntity")
        .where("event.tutorId = :tutorId", { tutorId: userId })
        .andWhere("event.studentId IN (:...studentIds)", {
          studentIds: connectedUserIds,
        })
        .orderBy("event.date", "ASC")
        .addOrderBy("event.time", "ASC")
        .getMany();
    } else {
      return this.eventsRepository
        .createQueryBuilder("event")
        .leftJoinAndSelect("event.tutor", "tutor")
        .leftJoinAndSelect("event.subjectEntity", "subjectEntity")
        .where("event.studentId = :studentId", { studentId: userId })
        .andWhere("event.tutorId IN (:...tutorIds)", {
          tutorIds: connectedUserIds,
        })
        .orderBy("event.date", "ASC")
        .addOrderBy("event.time", "ASC")
        .getMany();
    }
  }

  async findOne(id: number): Promise<Event | null> {
    return this.eventsRepository.findOne({
      where: { id },
      relations: ["student", "tutor", "subjectEntity"],
    });
  }

  async updatePaymentStatus(
    transactionId: number,
    status: boolean,
  ): Promise<void> {
    await this.eventsRepository.update(
      { transactionId },
      { paymentPending: status },
    );
  }

  async update(id: number, updateEventDto: any): Promise<Event> {
    await this.eventsRepository.update(id, updateEventDto);
    const updated = await this.eventsRepository.findOne({
      where: { id },
      relations: ["student", "tutor", "subjectEntity"],
    });
    if (!updated) {
      throw new Error("Event not found");
    }
    return updated;
  }

  async remove(id: number): Promise<void> {
    const event = await this.eventsRepository.findOne({ where: { id } });
    await this.homeworkRepository.delete({ lessonId: id });
    if (event && event.transactionId) {
      await this.financeService.deletePendingTransaction(event.transactionId);
    }
    await this.eventsRepository.delete(id);
  }

  async removeRecurring(id: number): Promise<void> {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) return;

    const { studentId, time, date, tutorId } = event;

    // Get day of week for the source event
    const sourceDate = new Date(date);
    const dayOfWeek = sourceDate.getDay();

    // We need to delete all future events with:
    // 1. Same student
    // 2. Same time
    // 3. Same day of week
    // 4. Same tutor
    // 5. Date >= source event date

    const allEvents = await this.eventsRepository.find({
      where: {
        studentId,
        time,
        tutorId,
      },
    });

    const eventsToDelete = allEvents.filter((e) => {
      const eDate = new Date(e.date);
      return eDate.getDay() === dayOfWeek && e.date >= date;
    });

    if (eventsToDelete.length > 0) {
      await this.homeworkRepository.delete({
        lessonId: In(eventsToDelete.map((e) => e.id)),
      });
      // Also delete pending transactions for these events
      for (const e of eventsToDelete) {
        if (e.transactionId) {
          await this.financeService.deletePendingTransaction(e.transactionId);
        }
      }
      await this.eventsRepository.remove(eventsToDelete);
    }
  }

  async updateRecurring(id: number, updateEventDto: any): Promise<void> {
    const originalEvent = await this.eventsRepository.findOne({
      where: { id },
    });
    if (!originalEvent) throw new Error("Event not found");

    const {
      studentId,
      time: oldTime,
      date: oldDateStr,
      tutorId,
    } = originalEvent;
    const oldDate = new Date(oldDateStr);
    const oldDayOfWeek = oldDate.getDay();

    // Find all future events in this series
    const allEvents = await this.eventsRepository.find({
      where: { studentId, time: oldTime, tutorId },
    });

    // Filter for events that are >= originalEvent.date and match the day of week
    const eventsToUpdate = allEvents.filter((e) => {
      const eDate = new Date(e.date);
      return eDate.getDay() === oldDayOfWeek && e.date >= oldDateStr;
    });

    // Calculate date shift if date changed
    let dateShiftDays = 0;
    if (updateEventDto.date && updateEventDto.date !== oldDateStr) {
      const newDate = new Date(updateEventDto.date);
      const diffTime = newDate.getTime() - oldDate.getTime();
      dateShiftDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    }

    // Prepare base updates (exclude date as it needs special handling)
    const baseUpdates = { ...updateEventDto };
    delete baseUpdates.date;
    delete baseUpdates.id; // Ensure ID is not updated

    for (const event of eventsToUpdate) {
      const updates: any = { ...baseUpdates };

      // Apply date shift if needed
      if (dateShiftDays !== 0) {
        const currentEventDate = new Date(event.date);
        currentEventDate.setDate(currentEventDate.getDate() + dateShiftDays);
        updates.date = currentEventDate.toISOString().split("T")[0];
      } else if (updateEventDto.date) {
        // If date didn't change (shift is 0) but was provided, it means we are just updating other fields
        // But if we are here, dateShiftDays is 0, so updateEventDto.date == oldDateStr
        // So we don't need to do anything with date unless...
        // Wait, if dateShiftDays is 0, then updates.date is not set, which is correct (date didn't change)
      }

      await this.eventsRepository.update(event.id, updates);
    }
  }
}

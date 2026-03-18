import { Repository } from "typeorm";
import { Homework } from "./entities/homework.entity";
import { Event } from "../calendar/entities/event.entity";
import { FileEntity } from "../files/entities/file.entity";
export declare class HomeworkService {
    private homeworkRepository;
    private eventsRepository;
    private filesRepository;
    constructor(homeworkRepository: Repository<Homework>, eventsRepository: Repository<Event>, filesRepository: Repository<FileEntity>);
    private getEventStartUtc;
    findAll(userId: number, role: string): Promise<Homework[]>;
    checkAndCreateHWDrafts(tutorId: number): Promise<void>;
    create(createDto: any, tutorId: number): Promise<Homework | Homework[]>;
    update(id: number, updateDto: any, userId: number, role: string): Promise<Homework>;
    findOne(id: number, userId: number, role: string): Promise<Homework>;
    delete(id: number, tutorId: number): Promise<Homework>;
}

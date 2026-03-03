import { Repository } from "typeorm";
import { Subject } from "./entities/subject.entity";
import { FilesService } from "../files/files.service";
import { ConnectionsService } from "../connections/connections.service";
export declare class SubjectsService {
    private subjectsRepository;
    private filesService;
    private connectionsService;
    constructor(subjectsRepository: Repository<Subject>, filesService: FilesService, connectionsService: ConnectionsService);
    create(tutorId: number, createSubjectDto: any): Promise<Subject[]>;
    findAll(userId: number, userRole?: string): Promise<Subject[]>;
    findOne(id: number): Promise<Subject>;
    update(id: number, updateSubjectDto: any): Promise<Subject>;
    findByIds(ids: number[]): Promise<Subject[]>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}

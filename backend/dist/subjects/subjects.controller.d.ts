import { SubjectsService } from "./subjects.service";
export declare class SubjectsController {
    private readonly subjectsService;
    constructor(subjectsService: SubjectsService);
    create(createSubjectDto: {
        name: string;
        color?: string;
    }, req: any): Promise<import("./entities/subject.entity").Subject[]>;
    findAll(req: any): Promise<import("./entities/subject.entity").Subject[]>;
    update(id: number, updateSubjectDto: {
        name?: string;
        color?: string;
    }): Promise<import("./entities/subject.entity").Subject>;
    remove(id: number): Promise<import("typeorm").DeleteResult>;
}

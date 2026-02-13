import { HomeworkService } from './homework.service';
export declare class HomeworkController {
    private readonly homeworkService;
    constructor(homeworkService: HomeworkService);
    findAll(req: any): Promise<import("./entities/homework.entity").Homework[]>;
    findOne(id: number, req: any): Promise<import("./entities/homework.entity").Homework>;
    create(createDto: any, req: any): Promise<import("./entities/homework.entity").Homework | import("./entities/homework.entity").Homework[]>;
    update(id: number, updateDto: any, req: any): Promise<import("./entities/homework.entity").Homework>;
    delete(id: number, req: any): Promise<import("./entities/homework.entity").Homework>;
}

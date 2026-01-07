import { TasksService } from './tasks.service';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(createTaskDto: any, req: any): Promise<import("./entities/task.entity").Task>;
    findAll(req: any): Promise<import("./entities/task.entity").Task[]>;
    update(id: string, updateTaskDto: any): Promise<import("./entities/task.entity").Task>;
    remove(id: string): Promise<void>;
}

import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { ConnectionsService } from '../connections/connections.service';
export declare class TasksService {
    private tasksRepository;
    private connectionsService;
    constructor(tasksRepository: Repository<Task>, connectionsService: ConnectionsService);
    create(createTaskDto: any): Promise<Task>;
    findAll(userId: number, userRole: string): Promise<Task[]>;
    update(id: number, updateTaskDto: any): Promise<Task>;
    remove(id: number): Promise<void>;
}

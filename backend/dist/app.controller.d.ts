import { DataSource } from "typeorm";
export declare class AppController {
    private dataSource;
    constructor(dataSource: DataSource);
    getHello(): {
        message: string;
        status: string;
    };
    getHealth(): {
        status: string;
        timestamp: string;
    };
    clearData(): Promise<{
        message: string;
    }>;
}

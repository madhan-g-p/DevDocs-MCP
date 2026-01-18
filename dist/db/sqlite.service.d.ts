import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class SqliteService implements OnModuleInit, OnModuleDestroy {
    private db;
    private dbPath;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    private initSchema;
    save(): void;
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    get<T>(sql: string, params?: any[]): Promise<T | undefined>;
    run(sql: string, params?: any[]): Promise<void>;
    runNoSave(sql: string, params?: any[]): Promise<void>;
}

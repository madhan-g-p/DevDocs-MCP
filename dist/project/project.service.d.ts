import { SqliteService } from '../db/sqlite.service';
export declare class ProjectService {
    private readonly sqlite;
    constructor(sqlite: SqliteService);
    getProject(id: string): Promise<unknown>;
    createProject(id: string, name: string, path: string, deps: Record<string, string>, ecosystem?: string): Promise<{
        id: string;
        name: string;
        path: string;
        deps: Record<string, string>;
    }>;
    getDeps(id: string): Promise<Record<string, string> | null>;
}

import { SqliteService } from '../db/sqlite.service';
export declare class DocsService {
    private readonly sqlite;
    private dbContentCache;
    constructor(sqlite: SqliteService);
    getDocEntries(query?: string, packageNames?: string[]): Promise<any[]>;
    loadDoc(docId: string): Promise<{
        title: any;
        content: any;
        source_path: any;
    }>;
    getRelatedDocs(docId: string): Promise<any[]>;
}

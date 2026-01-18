import { SqliteService } from '../db/sqlite.service';
export declare class IngestionService {
    private readonly sqlite;
    constructor(sqlite: SqliteService);
    isDocDownloaded(packageName: string, version: string): Promise<boolean>;
    syncCatalog(): Promise<void>;
    getNearestVersion(packageName: string, requestedVersion: string): Promise<{
        version: string;
        slug: string;
        isExact: boolean;
    } | null>;
    downloadDoc(slug: string, version: string, devdocsBase: string): Promise<string | null>;
    registerDocSource(packageName: string, version: string, docPath: string, slug: string): Promise<void>;
    ingestProjectDocs(projectDeps: Record<string, string>, devdocsBase: string): Promise<{
        package: string;
        version: string;
        status: string;
        caveat?: string;
    }[]>;
}

import { IngestionService } from '../docs/ingestion.service';
export declare class IngestionTool {
    private readonly ingestion;
    constructor(ingestion: IngestionService);
    execute(input: {
        dependencies: Record<string, string>;
        devdocsBase?: string;
    }): Promise<{
        status: string;
        message: string;
        details: {
            package: string;
            version: string;
            status: string;
            caveat?: string;
        }[];
    }>;
}

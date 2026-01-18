import { OnModuleInit } from '@nestjs/common';
import { SearchTool } from '../tools/search.tool';
import { ExplainTool } from '../tools/explain.tool';
import { RelatedTool } from '../tools/related.tool';
import { IngestionTool } from '../tools/ingestion.tool';
import { ProjectTool } from '../tools/project.tool';
export declare class McpService implements OnModuleInit {
    private readonly searchTool;
    private readonly explainTool;
    private readonly relatedTool;
    private readonly ingestionTool;
    private readonly projectTool;
    private server;
    private sseTransports;
    constructor(searchTool: SearchTool, explainTool: ExplainTool, relatedTool: RelatedTool, ingestionTool: IngestionTool, projectTool: ProjectTool);
    onModuleInit(): Promise<void>;
    initializeStdio(): Promise<void>;
    handleSseConnection(res: any): Promise<void>;
    handleSseMessage(sessionId: string, body: any, res: any): Promise<void>;
    private setupTools;
}

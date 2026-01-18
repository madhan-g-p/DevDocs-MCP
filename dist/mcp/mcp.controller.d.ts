import { McpService } from './mcp.service';
import { Response } from 'express';
export declare class McpController {
    private readonly mcpService;
    constructor(mcpService: McpService);
    sse(res: Response): Promise<void>;
    messages(sessionId: string, body: any, res: Response): Promise<void>;
}

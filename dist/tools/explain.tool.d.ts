import { DocsService } from '../docs/docs.service';
import { ExplainInput } from '../types/tools';
export declare class ExplainTool {
    private readonly docs;
    constructor(docs: DocsService);
    execute(input: ExplainInput): Promise<{
        title: any;
        content: any;
        source_path: any;
    }>;
}

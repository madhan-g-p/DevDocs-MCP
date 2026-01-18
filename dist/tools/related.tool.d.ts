import { DocsService } from '../docs/docs.service';
import { RelatedInput } from '../types/tools';
export declare class RelatedTool {
    private readonly docs;
    constructor(docs: DocsService);
    execute(input: RelatedInput): Promise<{
        related: {
            id: any;
            title: any;
            relation: any;
        }[];
    }>;
}

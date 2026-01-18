import { DocsService } from '../docs/docs.service';
import { ProjectService } from '../project/project.service';
import { SearchInput, SearchResult } from '../types/tools';
export declare class SearchTool {
    private readonly docs;
    private readonly projectService;
    constructor(docs: DocsService, projectService: ProjectService);
    execute(input: SearchInput): Promise<SearchResult[]>;
}

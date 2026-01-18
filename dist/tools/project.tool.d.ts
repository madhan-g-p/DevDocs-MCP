import { ProjectService } from '../project/project.service';
import { ProjectInput } from '../types/tools';
export declare class ProjectTool {
    private readonly projectService;
    constructor(projectService: ProjectService);
    execute(input: ProjectInput): Promise<{
        status: string;
        projectId: string;
        message: string;
    }>;
}

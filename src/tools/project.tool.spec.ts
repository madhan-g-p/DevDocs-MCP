import { Test, TestingModule } from '@nestjs/testing';
import { ProjectTool } from './project.tool';
import { ProjectService } from '../project/project.service';

describe('ProjectTool', () => {
  let tool: ProjectTool;
  let projectService: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectTool,
        {
          provide: ProjectService,
          useValue: {
            createProject: jest.fn(),
          },
        },
      ],
    }).compile();

    tool = module.get<ProjectTool>(ProjectTool);
    projectService = module.get<ProjectService>(ProjectService);
  });

  it('should setup a project and return success message', async () => {
    const input = {
      name: 'Test Project',
      path: '/abs/path',
      dependencies: { react: '18.2.0' },
      ecosystem: 'npm',
    };

    (projectService.createProject as jest.Mock).mockResolvedValue({ id: 'proj-1' });

    const result = await tool.execute(input);

    expect(projectService.createProject).toHaveBeenCalledWith(
      expect.any(String),
      input.name,
      input.path,
      input.dependencies,
      'npm'
    );
    expect(result.message).toContain('configured');
    expect(result.projectId).toBeDefined();
  });
});

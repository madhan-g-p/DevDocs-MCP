import { Test, TestingModule } from '@nestjs/testing';
import { SearchTool } from './search.tool';
import { DocsService } from '../docs/docs.service';
import { ProjectService } from '../project/project.service';

describe('SearchTool', () => {
  let tool: SearchTool;
  let docsService: DocsService;
  let projectService: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchTool,
        {
          provide: DocsService,
          useValue: {
            getDocEntries: jest.fn(),
          },
        },
        {
          provide: ProjectService,
          useValue: {
            getDeps: jest.fn(),
          },
        },
      ],
    }).compile();

    tool = module.get<SearchTool>(SearchTool);
    docsService = module.get<DocsService>(DocsService);
    projectService = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(tool).toBeDefined();
  });

  it('should return search results with scores', async () => {
    const mockEntries = [
      {
        id: 'react/hooks',
        title: 'React Hooks',
        keywords: 'useeffect usestate',
        slug: 'hooks',
        package_name: 'react',
        source_path: '/data/react/18.2.0',
      },
      {
        id: 'react/components',
        title: 'React Components',
        keywords: 'props state',
        slug: 'components',
        package_name: 'react',
        source_path: '/data/react/18.2.0',
      },
    ];

    (docsService.getDocEntries as jest.Mock).mockResolvedValue(mockEntries);

    const results = await tool.execute({ query: 'hooks', limit: 5 });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      id: 'react/hooks',
      title: 'React Hooks',
      source: 'react',
      type: 'Entry',
    });
    expect(results[0].score).toBeGreaterThan(0.3);
  });

  it('should boost results based on project context', async () => {
    const mockEntries = [
      {
        id: 'node/fs',
        title: 'FileSystem',
        keywords: 'read write',
        slug: 'fs',
        package_name: 'node',
        source_path: '/data/node/20',
      },
    ];

    (docsService.getDocEntries as jest.Mock).mockResolvedValue(mockEntries);
    (projectService.getDeps as jest.Mock).mockResolvedValue({ node: '20' });

    const resultsWithoutContext = await tool.execute({ query: 'fs' });
    const resultsWithContext = await tool.execute({ query: 'fs', projectId: 'my-project' });

    expect(resultsWithContext[0].score).toBeGreaterThan(resultsWithoutContext[0].score);
  });

  describe('Extended search queries', () => {
    it('should rank exact title matches highest (e.g., useContext)', async () => {
      const mockEntries = [
        {
          id: 'react:reference/react/usecontext',
          title: 'useContext',
          slug: 'reference/react/usecontext',
          package_name: 'react',
        },
        {
          id: 'react:reference/react/usecallback',
          title: 'useCallback',
          slug: 'reference/react/usecallback',
          package_name: 'react',
        },
      ];

      (docsService.getDocEntries as jest.Mock).mockResolvedValue(mockEntries);

      const results = await tool.execute({ query: 'useContext' });

      expect(results[0].title).toBe('useContext');
      expect(results[0].score).toBe(0.6); // Exact match score
    });

    it('should handle multi-token queries like Intersection Observer', async () => {
      const mockEntries = [
        {
          id: 'dom:intersection_observer_api',
          title: 'Intersection Observer API',
          slug: 'intersection_observer_api',
          package_name: 'dom',
        },
      ];

      (docsService.getDocEntries as jest.Mock).mockResolvedValue(mockEntries);

      const results = await tool.execute({ query: 'Intersection Observer' });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('Intersection Observer');
    });

    it('should return results from multiple packages for generic queries like margin', async () => {
      const mockEntries = [
        {
          id: 'tailwindcss:margin',
          title: 'margin',
          slug: 'margin',
          package_name: 'tailwindcss',
        },
        {
          id: 'dom:intersectionobserver/rootmargin',
          title: 'IntersectionObserver.rootMargin',
          slug: 'intersectionobserver/rootmargin',
          package_name: 'dom',
        },
      ];

      (docsService.getDocEntries as jest.Mock).mockResolvedValue(mockEntries);

      const results = await tool.execute({ query: 'margin' });

      const packages = results.map(r => r.source);
      expect(packages).toContain('tailwindcss');
      expect(packages).toContain('dom');
    });
  });
});

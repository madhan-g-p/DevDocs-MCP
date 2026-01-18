import { Test, TestingModule } from '@nestjs/testing';
import { ExplainTool } from './explain.tool';
import { DocsService } from '../docs/docs.service';

describe('ExplainTool', () => {
  let tool: ExplainTool;
  let docsService: DocsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExplainTool,
        {
          provide: DocsService,
          useValue: {
            loadDoc: jest.fn(),
          },
        },
      ],
    }).compile();

    tool = module.get<ExplainTool>(ExplainTool);
    docsService = module.get<DocsService>(DocsService);
  });

  it('should return documentation content', async () => {
    const mockDoc = {
      title: 'Hooks',
      content: '<h1>Hooks are great</h1>',
      source_path: '/path/to/react',
    };

    (docsService.loadDoc as jest.Mock).mockResolvedValue(mockDoc);

    const result = await tool.execute({ docId: 'react/hooks' });

    expect(result).toMatchObject({
      title: 'Hooks',
    });
    expect(result.content).toContain('Hooks are great');
  });

  it('should throw error if doc not found', async () => {
    (docsService.loadDoc as jest.Mock).mockRejectedValue(new Error('Doc not found'));

    await expect(tool.execute({ docId: 'invalid' })).rejects.toThrow('Doc not found');
  });
});

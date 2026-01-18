import { Test, TestingModule } from '@nestjs/testing';
import { SearchTool } from '../tools/search.tool';
import { IngestionTool } from '../tools/ingestion.tool';
import { ExplainTool } from '../tools/explain.tool';
import { DocsService } from '../docs/docs.service';
import { IngestionService } from '../docs/ingestion.service';
import { ProjectService } from '../project/project.service';
import { SqliteService } from '../db/sqlite.service';
import * as fs from 'fs';

describe('MCP Tools Integration', () => {
    let module: TestingModule;
    let searchTool: SearchTool;
    let ingestionTool: IngestionTool;
    let explainTool: ExplainTool;
    let sqliteService: SqliteService;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            providers: [
                SearchTool,
                IngestionTool,
                ExplainTool,
                DocsService,
                IngestionService,
                ProjectService,
                {
                    provide: SqliteService,
                    useValue: {
                        onModuleInit: jest.fn(),
                        query: jest.fn(),
                        get: jest.fn(),
                        run: jest.fn(),
                        runNoSave: jest.fn(),
                        save: jest.fn(),
                    },
                },
            ],
        }).compile();

        searchTool = module.get<SearchTool>(SearchTool);
        ingestionTool = module.get<IngestionTool>(IngestionTool);
        explainTool = module.get<ExplainTool>(ExplainTool);
        sqliteService = module.get<SqliteService>(SqliteService);
    });

    it('should complete a full flow: Ingest -> Search -> Explain', async () => {
        // 1. Mock Ingestion
        // Mocking the behavior of IngestionService.ingestProjectDocs
        const mockIngestResult = [
            { package: 'react', version: '18', status: 'downloaded' }
        ];
        jest.spyOn(module.get(IngestionService), 'ingestProjectDocs').mockResolvedValue(mockIngestResult as any);

        const ingestResponse = await ingestionTool.execute({
            dependencies: { react: '18.2.0' }
        });
        expect(ingestResponse.status).toBe('success');

        // 2. Mock Search
        const mockSearchEntries = [
            {
                id: 'react:reference/react/usecontext',
                title: 'useContext',
                keywords: 'hooks',
                slug: 'reference/react/usecontext',
                package_name: 'react',
                source_path: 'data/react'
            }
        ];
        (sqliteService.query as jest.Mock).mockResolvedValue(mockSearchEntries);

        const searchResults = await searchTool.execute({ query: 'useContext' });
        expect(searchResults.length).toBe(1);
        expect(searchResults[0].id).toBe('react:reference/react/usecontext');

        // 3. Mock Explain
        const mockDocData = {
            id: 'react:reference/react/usecontext',
            title: 'useContext',
            slug: 'reference/react/usecontext',
            source_path: 'data/react'
        };
        (sqliteService.get as jest.Mock).mockResolvedValue(mockDocData);
        
        // Mock filesystem for DocsService.loadDoc
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({
            'reference/react/usecontext': '<h1>useContext</h1>'
        }));

        const explanation = await explainTool.execute({
            docId: 'react:reference/react/usecontext'
        });
        expect(explanation.title).toBe('useContext');
        expect(explanation.content).toContain('<h1>useContext</h1>');
    });
});

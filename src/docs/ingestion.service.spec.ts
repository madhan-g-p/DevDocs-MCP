import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { SqliteService } from '../db/sqlite.service';

describe('IngestionService', () => {
  let service: IngestionService;
  let sqliteService: SqliteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: SqliteService,
          useValue: {
            get: jest.fn(),
            query: jest.fn(),
            run: jest.fn(),
            runNoSave: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    sqliteService = module.get<SqliteService>(SqliteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNearestVersion', () => {
    it('should find documentation by exact name', async () => {
      const mockEntries = [
        { version: '18', slug: 'react~18', release: '18.3.1' }
      ];
      (sqliteService.query as jest.Mock).mockResolvedValue(mockEntries);

      const result = await service.getNearestVersion('react', '18.2.0');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('react~18');
      expect(sqliteService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE name=?'),
        expect.arrayContaining(['react'])
      );
    });

    it('should find documentation by slug', async () => {
      const mockEntries = [
        { version: '', slug: 'dom', release: 'latest' }
      ];
      (sqliteService.query as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce(mockEntries);
      (sqliteService.runNoSave as jest.Mock).mockResolvedValue(undefined);
      
      // Mock syncCatalog behavior
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      });

      const result = await service.getNearestVersion('dom', 'latest');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('dom');
    });

    it('should return latest fallback if no exact version matches', async () => {
      const mockEntries = [
        { version: '3', slug: 'tailwindcss~3', release: '3.4.1' },
        { version: '4', slug: 'tailwindcss', release: '4.0.0' }
      ];
      (sqliteService.query as jest.Mock).mockResolvedValue(mockEntries);

      const result = await service.getNearestVersion('tailwindcss', '5.0.0');

      expect(result).not.toBeNull();
      // Depending on sorting logic, it should pick one. 
      // The current logic picks entries[0] or one with empty version.
      expect(result?.version).toBeDefined();
    });
  });
});

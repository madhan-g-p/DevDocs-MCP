import { Module } from '@nestjs/common';
import { DocsService } from './docs.service';
import { IngestionService } from './ingestion.service';
import { SqliteModule } from '../db/sqlite.module';

@Module({
  imports: [SqliteModule],
  providers: [DocsService, IngestionService],
  exports: [DocsService, IngestionService],
})
export class DocsModule {}

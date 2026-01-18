import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { SqliteModule } from '../db/sqlite.module';

@Module({
  imports: [SqliteModule],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}

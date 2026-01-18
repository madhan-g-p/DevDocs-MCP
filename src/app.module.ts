import { Module } from '@nestjs/common';
import { SqliteModule } from './db/sqlite.module';
import { DocsModule } from './docs/docs.module';
import { ProjectModule } from './project/project.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
      SqliteModule,
      DocsModule,
      ProjectModule,
      McpModule
  ],
})
export class AppModule {}

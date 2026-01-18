import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { McpController } from './mcp.controller';
import { SearchTool } from '../tools/search.tool';
import { ExplainTool } from '../tools/explain.tool';
import { RelatedTool } from '../tools/related.tool';
import { IngestionTool } from '../tools/ingestion.tool';
import { ProjectTool } from '../tools/project.tool';
import { DocsModule } from '../docs/docs.module';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [DocsModule, ProjectModule],
  controllers: [McpController],
  providers: [
      McpService, 
      SearchTool, 
      ExplainTool, 
      RelatedTool, 
      IngestionTool,
      ProjectTool
  ],
  exports: [McpService],
})
export class McpModule {}

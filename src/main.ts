#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { McpService } from './mcp/mcp.service';

async function bootstrap() {
  // Parse simple CLI arguments
  const args = process.argv.slice(2);
  const portArg = args.find(a => a.startsWith('--port='))?.split('=')[1] || (args.includes('--port') ? args[args.indexOf('--port') + 1] : null);
  const port = portArg || process.env.PORT || process.env.MCP_PORT;

  if (port) {
    // Web Server Mode (SSE)
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS for web clients if needed
    app.enableCors();
    
    await app.listen(port);
    console.error(`DevDocs MCP Server listening on port ${port} (SSE Transport)`);
    console.error(`SSE Endpoint: http://localhost:${port}/mcp/sse`);
    console.error(`Messages Endpoint: http://localhost:${port}/mcp/messages`);
  } else {
    // Stdio Mode
    // Disable nestjs logger to keep stdout clean for MCP JSON-RPC
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });

    const mcpService = app.get(McpService);
    
    // Initialize official MCP SDK server on stdio
    await mcpService.initializeStdio();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
       await app.close();
       process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await app.close();
      process.exit(0);
    });
  }
}

bootstrap().catch(err => {
    console.error('Fatal error during bootstrap:', err);
    process.exit(1);
});

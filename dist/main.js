#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
dotenv.config();
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const mcp_service_1 = require("./mcp/mcp.service");
async function bootstrap() {
    var _a;
    const args = process.argv.slice(2);
    const portArg = ((_a = args.find(a => a.startsWith('--port='))) === null || _a === void 0 ? void 0 : _a.split('=')[1]) || (args.includes('--port') ? args[args.indexOf('--port') + 1] : null);
    const port = portArg || process.env.PORT || process.env.MCP_PORT;
    if (port) {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        app.enableCors();
        await app.listen(port);
        console.error(`DevDocs MCP Server listening on port ${port} (SSE Transport)`);
        console.error(`SSE Endpoint: http://localhost:${port}/mcp/sse`);
        console.error(`Messages Endpoint: http://localhost:${port}/mcp/messages`);
    }
    else {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
            logger: false,
        });
        const mcpService = app.get(mcp_service_1.McpService);
        await mcpService.initializeStdio();
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

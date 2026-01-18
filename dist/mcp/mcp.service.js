"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpService = void 0;
const common_1 = require("@nestjs/common");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const zod_1 = require("zod");
const search_tool_1 = require("../tools/search.tool");
const explain_tool_1 = require("../tools/explain.tool");
const related_tool_1 = require("../tools/related.tool");
const ingestion_tool_1 = require("../tools/ingestion.tool");
const project_tool_1 = require("../tools/project.tool");
let McpService = class McpService {
    constructor(searchTool, explainTool, relatedTool, ingestionTool, projectTool) {
        this.searchTool = searchTool;
        this.explainTool = explainTool;
        this.relatedTool = relatedTool;
        this.ingestionTool = ingestionTool;
        this.projectTool = projectTool;
        this.sseTransports = new Map();
        this.server = new mcp_js_1.McpServer({
            name: 'devdocs-mcp-server',
            version: '0.1.0',
        });
    }
    async onModuleInit() {
        this.setupTools();
    }
    async initializeStdio() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.log('DevDocs MCP Server running on stdio');
    }
    async handleSseConnection(res) {
        const transport = new sse_js_1.SSEServerTransport('/mcp/messages', res);
        await this.server.connect(transport);
        const sessionId = transport.sessionId;
        if (sessionId) {
            this.sseTransports.set(sessionId, transport);
            res.on('close', () => {
                this.sseTransports.delete(sessionId);
            });
        }
    }
    async handleSseMessage(sessionId, body, res) {
        const transport = this.sseTransports.get(sessionId);
        if (!transport) {
            res.status(404).send('Session not found');
            return;
        }
        await transport.handlePostMessage(body, res);
    }
    setupTools() {
        this.server.registerTool('search', {
            description: 'Search documentation entries based on a query string. Supports fuzzy matching and project context boosting.',
            inputSchema: zod_1.z.object({
                query: zod_1.z.string().describe('The search query (e.g., "react hooks", "python list")'),
                limit: zod_1.z.number().optional().describe('Maximum number of results to return (default 5)'),
                projectId: zod_1.z.string().optional().describe('Optional project ID to prioritize documentation relevant to project dependencies'),
            })
        }, async (args) => {
            const result = await this.searchTool.execute(args);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        });
        this.server.registerTool('explain', {
            description: 'Get the detailed content/documentation for a specific entry ID.',
            inputSchema: zod_1.z.object({
                docId: zod_1.z.string().describe('The unique ID of the documentation entry (returned from search)'),
            })
        }, async (args) => {
            const result = await this.explainTool.execute(args);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        });
        this.server.registerTool('related', {
            description: 'Get related documentation entries for a specific doc ID.',
            inputSchema: zod_1.z.object({
                docId: zod_1.z.string().describe('The unique ID of the documentation entry'),
            })
        }, async (args) => {
            const result = await this.relatedTool.execute(args);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        });
        this.server.registerTool('ingest', {
            description: 'Ingest or sync documentation for a set of project dependencies.',
            inputSchema: zod_1.z.object({
                dependencies: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).describe('A map of package names to versions (e.g., {"react": "18.2.0"})'),
                devdocsBase: zod_1.z.string().optional().describe('Optional custom path to store/load DevDocs data'),
            })
        }, async (args) => {
            const result = await this.ingestionTool.execute(args);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        });
        this.server.registerTool('setup_project', {
            description: 'Configure and save project context (dependencies and path) in the local database.',
            inputSchema: zod_1.z.object({
                name: zod_1.z.string().describe('Name of the project'),
                path: zod_1.z.string().describe('Absolute path to the project root'),
                dependencies: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).describe('Project dependencies (e.g., from package.json)'),
                ecosystem: zod_1.z.string().optional().describe('The package ecosystem (e.g., "npm", "pnpm", "pip", "cargo"). Defaults to "npm".'),
            })
        }, async (args) => {
            const result = await this.projectTool.execute(args);
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        });
    }
};
exports.McpService = McpService;
exports.McpService = McpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [search_tool_1.SearchTool,
        explain_tool_1.ExplainTool,
        related_tool_1.RelatedTool,
        ingestion_tool_1.IngestionTool,
        project_tool_1.ProjectTool])
], McpService);

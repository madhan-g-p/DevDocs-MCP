"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpModule = void 0;
const common_1 = require("@nestjs/common");
const mcp_service_1 = require("./mcp.service");
const mcp_controller_1 = require("./mcp.controller");
const search_tool_1 = require("../tools/search.tool");
const explain_tool_1 = require("../tools/explain.tool");
const related_tool_1 = require("../tools/related.tool");
const ingestion_tool_1 = require("../tools/ingestion.tool");
const project_tool_1 = require("../tools/project.tool");
const docs_module_1 = require("../docs/docs.module");
const project_module_1 = require("../project/project.module");
let McpModule = class McpModule {
};
exports.McpModule = McpModule;
exports.McpModule = McpModule = __decorate([
    (0, common_1.Module)({
        imports: [docs_module_1.DocsModule, project_module_1.ProjectModule],
        controllers: [mcp_controller_1.McpController],
        providers: [
            mcp_service_1.McpService,
            search_tool_1.SearchTool,
            explain_tool_1.ExplainTool,
            related_tool_1.RelatedTool,
            ingestion_tool_1.IngestionTool,
            project_tool_1.ProjectTool
        ],
        exports: [mcp_service_1.McpService],
    })
], McpModule);

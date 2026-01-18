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
exports.SearchTool = void 0;
const common_1 = require("@nestjs/common");
const docs_service_1 = require("../docs/docs.service");
const project_service_1 = require("../project/project.service");
let SearchTool = class SearchTool {
    constructor(docs, projectService) {
        this.docs = docs;
        this.projectService = projectService;
    }
    async execute(input) {
        const limit = input.limit || 5;
        let projectDeps = null;
        let packageNames = undefined;
        if (input.projectId) {
            projectDeps = await this.projectService.getDeps(input.projectId);
            if (projectDeps) {
                packageNames = Object.keys(projectDeps);
            }
        }
        console.log(`[Search] Querying docs for "${input.query}"...`);
        const dbQuery = input.query === 'FORCE_ALL' ? '' : input.query;
        const entries = await this.docs.getDocEntries(dbQuery, packageNames);
        console.log(`[Search] Found ${entries.length} raw entries in DB.`);
        const queryTokens = input.query.toLowerCase().split(/[^a-z0-9]+/);
        const results = entries.map((entry) => {
            let score = 0;
            if (!entry.title)
                return null;
            const title = entry.title.toLowerCase();
            if (title === input.query.toLowerCase()) {
                score = 0.6;
            }
            else {
                const titleTokens = title.split(/[^a-z0-9]+/);
                const matchedTokens = queryTokens.filter(q => titleTokens.some((t) => t.includes(q) || q.includes(t)));
                if (matchedTokens.length > 0) {
                    const ratio = matchedTokens.length / Math.max(1, queryTokens.length);
                    score = 0.4 * ratio;
                }
            }
            if (projectDeps) {
                const pkgName = entry.package_name;
                if (projectDeps[pkgName]) {
                    score += 0.2;
                    const ver = projectDeps[pkgName];
                    if (entry.source_path.includes(ver)) {
                        score += 0.1;
                    }
                }
            }
            const keywords = entry.keywords ? entry.keywords.split(/\s+/) : [];
            const matchedKeywords = queryTokens.filter(t => keywords.includes(t));
            if (matchedKeywords.length > 0) {
                score += 0.1;
            }
            score = Math.min(1.0, score);
            return {
                id: entry.id,
                title: entry.title,
                source: entry.package_name,
                score,
                type: 'Entry',
                path: entry.slug
            };
        }).filter((r) => r !== null);
        return results.sort((a, b) => {
            if (!a || !b)
                return 0;
            const scoreDiff = b.score - a.score;
            if (Math.abs(scoreDiff) > 0.001)
                return scoreDiff;
            return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
        }).slice(0, limit);
    }
};
exports.SearchTool = SearchTool;
exports.SearchTool = SearchTool = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [docs_service_1.DocsService,
        project_service_1.ProjectService])
], SearchTool);

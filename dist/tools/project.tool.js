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
exports.ProjectTool = void 0;
const common_1 = require("@nestjs/common");
const project_service_1 = require("../project/project.service");
const crypto = require("crypto");
let ProjectTool = class ProjectTool {
    constructor(projectService) {
        this.projectService = projectService;
    }
    async execute(input) {
        var _a;
        if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
            throw new Error('Project name must be a non-empty string');
        }
        if (!input.path || typeof input.path !== 'string' || input.path.trim().length === 0) {
            throw new Error('Project path must be a non-empty string');
        }
        if (!input.dependencies || typeof input.dependencies !== 'object') {
            throw new Error('Dependencies must be an object (e.g., {"react": "18.2.0"})');
        }
        for (const [pkg, ver] of Object.entries(input.dependencies)) {
            if (typeof pkg !== 'string' || pkg.trim().length === 0) {
                throw new Error(`Invalid package name: "${pkg}" must be a non-empty string`);
            }
            if (typeof ver !== 'string' || ver.trim().length === 0) {
                throw new Error(`Invalid version for package "${pkg}": must be a non-empty string`);
            }
        }
        try {
            const id = crypto.createHash('md5').update(input.path.trim()).digest('hex');
            await this.projectService.createProject(id, input.name.trim(), input.path.trim(), input.dependencies, ((_a = input.ecosystem) === null || _a === void 0 ? void 0 : _a.trim()) || 'npm');
            return {
                status: 'success',
                projectId: id,
                message: `Project "${input.name}" configured with ${Object.keys(input.dependencies).length} dependencies.`
            };
        }
        catch (e) {
            throw new Error(`Failed to configure project: ${e.message}`);
        }
    }
};
exports.ProjectTool = ProjectTool;
exports.ProjectTool = ProjectTool = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [project_service_1.ProjectService])
], ProjectTool);

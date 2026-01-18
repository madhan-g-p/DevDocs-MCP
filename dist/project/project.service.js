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
exports.ProjectService = void 0;
const common_1 = require("@nestjs/common");
const sqlite_service_1 = require("../db/sqlite.service");
let ProjectService = class ProjectService {
    constructor(sqlite) {
        this.sqlite = sqlite;
    }
    async getProject(id) {
        return await this.sqlite.get('SELECT * FROM projects WHERE id=?', [id]);
    }
    async createProject(id, name, path, deps, ecosystem = 'npm') {
        await this.sqlite.run(`INSERT OR REPLACE INTO projects(id,name,path,last_accessed_at) VALUES(?,?,?,CURRENT_TIMESTAMP)`, [id, name, path]);
        await this.sqlite.runNoSave('BEGIN TRANSACTION');
        try {
            await this.sqlite.runNoSave('DELETE FROM project_dependencies WHERE project_id=?', [id]);
            for (const [pkg, ver] of Object.entries(deps)) {
                await this.sqlite.runNoSave(`INSERT INTO project_dependencies(project_id, ecosystem, package_name, version, source) VALUES(?,?,?,?,?)`, [id, ecosystem, pkg, ver, 'manual']);
            }
            await this.sqlite.runNoSave('COMMIT');
            this.sqlite.save();
        }
        catch (e) {
            await this.sqlite.runNoSave('ROLLBACK');
            console.error(`Failed to save dependencies for project ${id}:`, e);
        }
        await this.sqlite.run(`INSERT OR IGNORE INTO project_preferences(project_id) VALUES(?)`, [id]);
        return { id, name, path, deps };
    }
    async getDeps(id) {
        const deps = await this.sqlite.query(`SELECT package_name, version FROM project_dependencies WHERE project_id=?`, [id]);
        if (!deps || deps.length === 0)
            return null;
        const result = {};
        for (const dep of deps) {
            result[dep.package_name] = dep.version;
        }
        return result;
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sqlite_service_1.SqliteService])
], ProjectService);

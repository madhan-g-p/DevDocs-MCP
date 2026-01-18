"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteService = void 0;
const common_1 = require("@nestjs/common");
const initSqlJs = require("sql.js");
const fs = require("fs");
const buffer_1 = require("buffer");
let SqliteService = class SqliteService {
    async onModuleInit() {
        this.dbPath = process.env.MCP_DB_PATH || 'mcp.db';
        console.log(`Initializing sql.js at ${this.dbPath}`);
        const SQL = await initSqlJs();
        if (fs.existsSync(this.dbPath)) {
            const filebuffer = fs.readFileSync(this.dbPath);
            this.db = new SQL.Database(filebuffer);
        }
        else {
            this.db = new SQL.Database();
            this.initSchema();
            this.save();
        }
    }
    onModuleDestroy() {
        if (this.db) {
            this.save();
            this.db.close();
        }
    }
    initSchema() {
        this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT,
        path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS project_dependencies (
        project_id TEXT NOT NULL,
        ecosystem TEXT NOT NULL,
        package_name TEXT NOT NULL,
        version TEXT NOT NULL,
        source TEXT,
        PRIMARY KEY (project_id, package_name),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_preferences (
        project_id TEXT PRIMARY KEY,
        allow_experimental INTEGER DEFAULT 0,
        preferred_sources TEXT,
        ignored_sources TEXT,
        max_search_results INTEGER DEFAULT 5,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS doc_sources (
        id TEXT PRIMARY KEY,
        name TEXT,
        version TEXT,
        slug TEXT,
        path TEXT,
        release TEXT,
        mtime INTEGER,
        is_downloaded INTEGER DEFAULT 0,
        indexed_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS doc_entries (
        id TEXT PRIMARY KEY,
        source_id TEXT,
        title TEXT,
        slug TEXT,
        keywords TEXT,
        since TEXT,
        FOREIGN KEY(source_id) REFERENCES doc_sources(id)
      );

      CREATE TABLE IF NOT EXISTS doc_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_id TEXT,
        related_doc_id TEXT,
        relation_type TEXT,
        UNIQUE(doc_id, related_doc_id)
      );
    `);
    }
    save() {
        const data = this.db.export();
        const buffer = buffer_1.Buffer.from(data);
        fs.writeFileSync(this.dbPath, buffer);
    }
    async query(sql, params = []) {
        const safeParams = params.map(p => p === undefined ? null : p);
        const stmt = this.db.prepare(sql);
        stmt.bind(safeParams);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    }
    async get(sql, params = []) {
        const safeParams = params.map(p => p === undefined ? null : p);
        const stmt = this.db.prepare(sql);
        stmt.bind(safeParams);
        let result;
        if (stmt.step()) {
            result = stmt.getAsObject();
        }
        stmt.free();
        return result;
    }
    async run(sql, params = []) {
        const safeParams = params.map(p => p === undefined ? null : p);
        await this.db.run(sql, safeParams);
        await this.save();
    }
    async runNoSave(sql, params = []) {
        const safeParams = params.map(p => p === undefined ? null : p);
        await this.db.run(sql, safeParams);
    }
};
exports.SqliteService = SqliteService;
exports.SqliteService = SqliteService = __decorate([
    (0, common_1.Injectable)()
], SqliteService);

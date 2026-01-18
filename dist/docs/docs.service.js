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
exports.DocsService = void 0;
const common_1 = require("@nestjs/common");
const sqlite_service_1 = require("../db/sqlite.service");
const fs = require("fs");
const path = require("path");
let DocsService = class DocsService {
    constructor(sqlite) {
        this.sqlite = sqlite;
        this.dbContentCache = new Map();
    }
    async getDocEntries(query, packageNames) {
        let sql = `
      SELECT d.id, d.title, d.keywords, d.slug, s.name as package_name, s.path AS source_path
      FROM doc_entries d
      JOIN doc_sources s ON d.source_id = s.id
      WHERE 1=1
    `;
        const params = [];
        if (packageNames && packageNames.length > 0) {
            const placeholders = packageNames.map(() => '?').join(',');
            sql += ` AND s.name IN (${placeholders})`;
            params.push(...packageNames);
        }
        if (query) {
            sql += ` AND (COALESCE(d.title, '') LIKE ? OR COALESCE(d.keywords, '') LIKE ?)`;
            params.push(`%${query}%`, `%${query}%`);
        }
        sql += ` LIMIT 1000`;
        console.log(`[DocsService] Executing SQL: ${sql} with params: ${JSON.stringify(params)}`);
        return await this.sqlite.query(sql, params);
    }
    async loadDoc(docId) {
        const entry = await this.sqlite.get(`SELECT d.id, d.title, d.slug, s.path AS source_path
       FROM doc_entries d
       JOIN doc_sources s ON d.source_id = s.id
       WHERE d.id=?`, [docId]);
        if (!entry)
            throw new Error('Doc not found');
        const dbFile = path.join(entry.source_path, 'db.json');
        if (!fs.existsSync(dbFile))
            throw new Error('Doc database missing');
        let db = this.dbContentCache.get(dbFile);
        if (!db) {
            console.log(`[Docs] Parsing db.json for ${entry.source_path}...`);
            db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
            this.dbContentCache.set(dbFile, db);
            if (this.dbContentCache.size > 3) {
                const firstKey = this.dbContentCache.keys().next().value;
                this.dbContentCache.delete(firstKey);
            }
        }
        const content = db[entry.slug];
        if (!content)
            throw new Error('Content not found in db.json');
        return {
            title: entry.title,
            content: content,
            source_path: entry.source_path
        };
    }
    async getRelatedDocs(docId) {
        return await this.sqlite.query(`SELECT dr.related_doc_id AS id, d.title, dr.relation_type AS relation
       FROM doc_relationships dr
       JOIN doc_entries d ON dr.related_doc_id = d.id
       WHERE dr.doc_id=?`, [docId]);
    }
};
exports.DocsService = DocsService;
exports.DocsService = DocsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sqlite_service_1.SqliteService])
], DocsService);

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as initSqlJs from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { Buffer } from 'buffer';

// Define the Database type interface locally since we might not have types installed yet
interface SqlJsDatabase {
  run(sql: string, params?: any): any;
  exec(sql: string): Array<{ columns: string[], values: any[][] }>;
  prepare(sql: string, params?: any): any;
  export(): Uint8Array;
  close(): void;
}

@Injectable()
export class SqliteService implements OnModuleInit, OnModuleDestroy {
  private db: SqlJsDatabase;
  private dbPath: string;

  async onModuleInit() {
    this.dbPath = process.env.MCP_DB_PATH || 'mcp.db';
    console.log(`Initializing sql.js at ${this.dbPath}`);
    
    // Initialize WASM
    const SQL = await initSqlJs();
    
    if (fs.existsSync(this.dbPath)) {
      const filebuffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(filebuffer);
    } else {
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

  private initSchema() {
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
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const safeParams = params.map(p => p === undefined ? null : p);
    const stmt = this.db.prepare(sql);
    stmt.bind(safeParams);
    
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const safeParams = params.map(p => p === undefined ? null : p);
    const stmt = this.db.prepare(sql);
    stmt.bind(safeParams);
    let result: T | undefined;
    if (stmt.step()) {
      result = stmt.getAsObject() as T;
    }
    stmt.free();
    return result;
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    const safeParams = params.map(p => p === undefined ? null : p);
    await this.db.run(sql, safeParams);
    await this.save(); // Auto-save on writes for persistence
  }

  /**
   * Run SQL without auto-saving to disk. 
   * Useful for bulk operations/transactions where we save manually at the end.
   */
  async runNoSave(sql: string, params: any[] = []): Promise<void> {
    const safeParams = params.map(p => p === undefined ? null : p);
    await this.db.run(sql, safeParams);
  }
}

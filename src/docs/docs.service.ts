import { Injectable } from '@nestjs/common';
import { SqliteService } from '../db/sqlite.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocsService {
  private dbContentCache = new Map<string, any>();

  constructor(private readonly sqlite: SqliteService) {}

  /**
   * Get doc entries with optional filtering to optimize memory/speed.
   */
  async getDocEntries(query?: string, packageNames?: string[]) {
    let sql = `
      SELECT d.id, d.title, d.keywords, d.slug, s.name as package_name, s.path AS source_path
      FROM doc_entries d
      JOIN doc_sources s ON d.source_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (packageNames && packageNames.length > 0) {
      const placeholders = packageNames.map(() => '?').join(',');
      sql += ` AND s.name IN (${placeholders})`;
      params.push(...packageNames);
    }

    if (query) {
      // Basic fuzzy match in SQL to reduce result set
      // Use COALESCE in case title or keywords are NULL
      sql += ` AND (COALESCE(d.title, '') LIKE ? OR COALESCE(d.keywords, '') LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }

    // Limit absolute max to avoid memory crashes on massive queries
    sql += ` LIMIT 1000`;

    console.log(`[DocsService] Executing SQL: ${sql} with params: ${JSON.stringify(params)}`);
    return await this.sqlite.query<any>(sql, params);
  }

  async loadDoc(docId: string) {
    const entry = await this.sqlite.get<any>(
      `SELECT d.id, d.title, d.slug, s.path AS source_path
       FROM doc_entries d
       JOIN doc_sources s ON d.source_id = s.id
       WHERE d.id=?`,
      [docId]
    );

    if (!entry) throw new Error('Doc not found');
    
    const dbFile = path.join(entry.source_path, 'db.json');
    if (!fs.existsSync(dbFile)) throw new Error('Doc database missing');

    // Use cache to avoid re-parsing large JSON files
    let db = this.dbContentCache.get(dbFile);
    if (!db) {
      console.log(`[Docs] Parsing db.json for ${entry.source_path}...`);
      db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));
      this.dbContentCache.set(dbFile, db);
      
      // Basic cache eviction if it grows too large (e.g., > 3 entries)
      if (this.dbContentCache.size > 3) {
        const firstKey = this.dbContentCache.keys().next().value;
        this.dbContentCache.delete(firstKey);
      }
    }

    const content = db[entry.slug];

    if (!content) throw new Error('Content not found in db.json');

    return {
      title: entry.title,
      content: content, // HTML content
      source_path: entry.source_path
    };
  }

  async getRelatedDocs(docId: string) {
    return await this.sqlite.query<any>(
      `SELECT dr.related_doc_id AS id, d.title, dr.relation_type AS relation
       FROM doc_relationships dr
       JOIN doc_entries d ON dr.related_doc_id = d.id
       WHERE dr.doc_id=?`,
      [docId]
    );
  }
}

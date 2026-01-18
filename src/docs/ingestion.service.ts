import { Injectable } from '@nestjs/common';
import { SqliteService } from '../db/sqlite.service';
import * as fs from 'fs';
import * as path from 'path';
import { DEVDOCS_URLS } from '../config/constants';

/**
 * Handles downloading and registering documentation from DevDocs.
 */
@Injectable()
export class IngestionService {
  constructor(private readonly sqlite: SqliteService) {}

  /**
   * Check if a doc for a package/version is already downloaded
   */
  async isDocDownloaded(packageName: string, version: string): Promise<boolean> {
    const entry = await this.sqlite.get<any>(
      `SELECT s.id FROM doc_sources s WHERE s.name=? AND s.version=? AND s.is_downloaded=1`,
      [packageName, version]
    );
    return !!entry;
  }

  /**
   * Sync the DevDocs catalog to know what versions are available
   */
  async syncCatalog(): Promise<void> {
    const CATALOG_URL = DEVDOCS_URLS.CATALOG;
    console.log(`[Ingestion] Syncing catalog from ${CATALOG_URL}...`);
    
    try {
      const res = await fetch(CATALOG_URL);
      if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.statusText}`);
      
      const docs = await res.json();
      
      await this.sqlite.runNoSave('BEGIN TRANSACTION');
      for (const doc of docs) {
        // DevDocs catalog fields: name, slug, type, links, version, release, mtime, db_size
        const id = `${doc.name}@${doc.version || 'latest'}`;
        await this.sqlite.runNoSave(
          `INSERT INTO doc_sources(id, name, version, slug, release, mtime, is_downloaded)
           VALUES(?, ?, ?, ?, ?, ?, 0)
           ON CONFLICT(id) DO UPDATE SET
             slug=excluded.slug,
             release=excluded.release,
             mtime=excluded.mtime`,
          [id, doc.name, doc.version || 'latest', doc.slug, doc.release, doc.mtime]
        );
      }
      await this.sqlite.runNoSave('COMMIT');
      await this.sqlite.save();
      console.log(`[Ingestion] Synced ${docs.length} documentation sets.`);
    } catch (e) {
      console.error(`[Ingestion] Failed to sync catalog:`, e);
      try { await this.sqlite.runNoSave('ROLLBACK'); } catch (err) {}
    }
  }

  /**
   * Find nearest available version from DevDocs metadata
   */
  async getNearestVersion(packageName: string, requestedVersion: string): Promise<{ version: string, slug: string, isExact: boolean } | null> {
    // 1. Try to find in local catalog first
    // Check both name and slug to be more robust
    let entries = await this.sqlite.query<any>(
      `SELECT version, slug, release FROM doc_sources 
       WHERE name=? COLLATE NOCASE OR slug=? COLLATE NOCASE`,
      [packageName, packageName]
    );

    // 2. If no entries, sync catalog once
    if (entries.length === 0) {
      await this.syncCatalog();
      entries = await this.sqlite.query<any>(
        `SELECT version, slug, release FROM doc_sources 
         WHERE name=? COLLATE NOCASE OR slug=? COLLATE NOCASE`,
        [packageName, packageName]
      );
    }

    if (entries.length === 0) return null;

    // Normalize versions for comparison
    const target = requestedVersion.toLowerCase();

    // Strategy 1: Exact version match
    const exactMatch = entries.find(e => e.version.toLowerCase() === target || e.release?.toLowerCase() === target);
    if (exactMatch) {
      return { version: exactMatch.version, slug: exactMatch.slug, isExact: true };
    }

    // Strategy 2: Prefix match (e.g., requested "20.1" matches "20")
    const prefixMatch = entries.find(e => target.startsWith(e.version.toLowerCase()));
    if (prefixMatch) {
      return { version: prefixMatch.version, slug: prefixMatch.slug, isExact: false };
    }

    // Strategy 3: Latest version as fallback
    // Sort by mtime or release if we had it, for now just pick the first one which is often latest in catalog
    // Or try to find one where version is empty (often the 'latest')
    const latest = entries.find(e => !e.version) || entries[0];
    return { version: latest.version, slug: latest.slug, isExact: false };
  }

  /**
   * Download a specific doc from DevDocs.io
   */
  async downloadDoc(slug: string, version: string, devdocsBase: string): Promise<string | null> {
    const docPath = path.join(devdocsBase, slug); // Flattened for simplicity or use version nesting if preferred
    // DevDocs URL structure: https://documents.devdocs.io/[slug]/db.json
    // The slug often doesn't include version if it's the main one, or does like `node~20`.
    // For MVP, we will assume standard slug format matches packageName string.
    
    // Create directory
    if (!fs.existsSync(docPath)) {
        fs.mkdirSync(docPath, { recursive: true });
    }

    const filesToFetch = ['db.json', 'index.json'];
    const baseUrl = `${DEVDOCS_URLS.DOCS_BASE}/${slug}`; 
    // WARN: Real DevDocs URLs are complex (hash-based). 
    // This is a simplified implementation. A robust one needs a precise slug mapping.
    
    console.log(`[Ingestion] Downloading ${slug} from ${baseUrl}...`);

    for (const file of filesToFetch) {
        const filePath = path.join(docPath, file);
        if (fs.existsSync(filePath)) continue; // Skip if exists

        try {
            const res = await fetch(`${baseUrl}/${file}`);
            if (!res.ok) {
                console.error(`[Ingestion] Failed to fetch ${file}: ${res.statusText}`);
                return null;
            }
            const buffer = await res.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(buffer));
        } catch (e) {
             console.error(`[Ingestion] Network error fetching ${file}:`, e);
             return null;
        }
    }

    // Creating a dummy entries.json from index.json because DevDocs uses index.json
    // index.json format: { entries: [ { name, path, type... } ], types: [] }
    // We map this to our internal 'entries.json' format or just use index.json parsing directly in registerDocSource.
    // For compatibility with registerDocSource which expects 'entries.json':
    const indexFile = path.join(docPath, 'index.json');
    const entriesFile = path.join(docPath, 'entries.json');
    
    if (fs.existsSync(indexFile) && !fs.existsSync(entriesFile)) {
        const indexData = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
        // DevDocs index.json -> entries array
        if (indexData.entries) {
            fs.writeFileSync(entriesFile, JSON.stringify(indexData.entries, null, 2));
        }
    }

    return docPath;
  }

  /**
   * Register downloaded docs into SQLite
   */
  async registerDocSource(packageName: string, version: string, docPath: string, slug: string) {
    const sourceId = `${packageName}@${version}`;
    await this.sqlite.run(
      `INSERT OR REPLACE INTO doc_sources(id, name, version, slug, path, is_downloaded, indexed_at) 
       VALUES(?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      [sourceId, packageName, version, slug, docPath]
    );

    const entriesFile = path.join(docPath, 'entries.json');
    if (!fs.existsSync(entriesFile)) {
        console.warn(`[Ingestion] entries.json missing for ${sourceId}`);
        return;
    }

    const entries = JSON.parse(fs.readFileSync(entriesFile, 'utf-8'));
    
    // sql.js naive bulk insert
    // In a real optimized scenario, we would construct a single huge INSERT statement or use BEGIN/COMMIT
    this.sqlite.runNoSave('BEGIN TRANSACTION');
    try {
        for (const entry of entries) {
           // DevDocs 'path' serves as the slug/identifier in db.json
           // DevDocs 'name' is the display title
           const entrySlug = entry.slug || entry.path; 
           const entryTitle = entry.title || entry.name;
           
           if (!entrySlug || !entryTitle) continue;

           const id = `${sourceId}:${entrySlug}`;
           const keywords = entry.keywords ? (Array.isArray(entry.keywords) ? entry.keywords.join(' ') : entry.keywords) : '';
           
           // Param order: id, source_id, title, slug, keywords, since
           const params = [id, sourceId, entryTitle, entrySlug, keywords, entry.since || null];
           const safeParams = params.map(p => p === undefined ? null : p);

           this.sqlite.runNoSave(
             `INSERT OR REPLACE INTO doc_entries(id,source_id,title,slug,keywords,since)
              VALUES(?,?,?,?,?,?)`,
             safeParams
           );
        }
        this.sqlite.runNoSave('COMMIT');
        this.sqlite.save(); // Persist once at end
    } catch (e) {
        this.sqlite.runNoSave('ROLLBACK');
        console.error(`[Ingestion] Failed to register entries: ${e.message}`);
    }
    console.log(`[Ingestion] Registered ${entries.length} entries for ${sourceId}`);
  }

  /**
   * Main ingestion entry point
   */
  async ingestProjectDocs(
    projectDeps: Record<string, string>,
    devdocsBase: string
  ): Promise<{ package: string, version: string, status: string, caveat?: string }[]> {
    const results = [];

    for (const [pkg, requestedVer] of Object.entries(projectDeps)) {
      if (await this.isDocDownloaded(pkg, requestedVer)) {
        console.log(`Doc exists: ${pkg}@${requestedVer}`);
        results.push({ package: pkg, version: requestedVer, status: 'already_downloaded' });
        continue;
      }

      const resolution = await this.getNearestVersion(pkg, requestedVer);
      if (!resolution) {
        console.warn(`No available version found for ${pkg}`);
        results.push({ package: pkg, version: requestedVer, status: 'not_found' });
        continue;
      }

      const { version: actualVer, slug, isExact } = resolution;

      console.log(`Fetching ${pkg}@${actualVer} (Exact: ${isExact})`);
      const docPath = await this.downloadDoc(slug, actualVer, devdocsBase);
      
      if (docPath) {
        await this.registerDocSource(pkg, actualVer, docPath, slug);
        results.push({ 
          package: pkg, 
          version: actualVer, 
          status: 'downloaded',
          caveat: isExact ? undefined : `Requested ${requestedVer}, but only ${actualVer} was available. This is the closest we could get.`
        });
      } else {
        console.error(`Failed to fetch ${pkg}@${actualVer}`);
        results.push({ package: pkg, version: actualVer, status: 'failed' });
      }
    }
    return results;
  }
}

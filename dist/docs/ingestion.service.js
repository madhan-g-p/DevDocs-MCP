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
exports.IngestionService = void 0;
const common_1 = require("@nestjs/common");
const sqlite_service_1 = require("../db/sqlite.service");
const fs = require("fs");
const path = require("path");
const constants_1 = require("../config/constants");
let IngestionService = class IngestionService {
    constructor(sqlite) {
        this.sqlite = sqlite;
    }
    async isDocDownloaded(packageName, version) {
        const entry = await this.sqlite.get(`SELECT s.id FROM doc_sources s WHERE s.name=? AND s.version=? AND s.is_downloaded=1`, [packageName, version]);
        return !!entry;
    }
    async syncCatalog() {
        const CATALOG_URL = constants_1.DEVDOCS_URLS.CATALOG;
        console.log(`[Ingestion] Syncing catalog from ${CATALOG_URL}...`);
        try {
            const res = await fetch(CATALOG_URL);
            if (!res.ok)
                throw new Error(`Failed to fetch catalog: ${res.statusText}`);
            const docs = await res.json();
            await this.sqlite.runNoSave('BEGIN TRANSACTION');
            for (const doc of docs) {
                const id = `${doc.name}@${doc.version || 'latest'}`;
                await this.sqlite.runNoSave(`INSERT INTO doc_sources(id, name, version, slug, release, mtime, is_downloaded)
           VALUES(?, ?, ?, ?, ?, ?, 0)
           ON CONFLICT(id) DO UPDATE SET
             slug=excluded.slug,
             release=excluded.release,
             mtime=excluded.mtime`, [id, doc.name, doc.version || 'latest', doc.slug, doc.release, doc.mtime]);
            }
            await this.sqlite.runNoSave('COMMIT');
            await this.sqlite.save();
            console.log(`[Ingestion] Synced ${docs.length} documentation sets.`);
        }
        catch (e) {
            console.error(`[Ingestion] Failed to sync catalog:`, e);
            try {
                await this.sqlite.runNoSave('ROLLBACK');
            }
            catch (err) { }
        }
    }
    async getNearestVersion(packageName, requestedVersion) {
        let entries = await this.sqlite.query(`SELECT version, slug, release FROM doc_sources 
       WHERE name=? COLLATE NOCASE OR slug=? COLLATE NOCASE`, [packageName, packageName]);
        if (entries.length === 0) {
            await this.syncCatalog();
            entries = await this.sqlite.query(`SELECT version, slug, release FROM doc_sources 
         WHERE name=? COLLATE NOCASE OR slug=? COLLATE NOCASE`, [packageName, packageName]);
        }
        if (entries.length === 0)
            return null;
        const target = requestedVersion.toLowerCase();
        const exactMatch = entries.find(e => { var _a; return e.version.toLowerCase() === target || ((_a = e.release) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === target; });
        if (exactMatch) {
            return { version: exactMatch.version, slug: exactMatch.slug, isExact: true };
        }
        const prefixMatch = entries.find(e => target.startsWith(e.version.toLowerCase()));
        if (prefixMatch) {
            return { version: prefixMatch.version, slug: prefixMatch.slug, isExact: false };
        }
        const latest = entries.find(e => !e.version) || entries[0];
        return { version: latest.version, slug: latest.slug, isExact: false };
    }
    async downloadDoc(slug, version, devdocsBase) {
        const docPath = path.join(devdocsBase, slug);
        if (!fs.existsSync(docPath)) {
            fs.mkdirSync(docPath, { recursive: true });
        }
        const filesToFetch = ['db.json', 'index.json'];
        const baseUrl = `${constants_1.DEVDOCS_URLS.DOCS_BASE}/${slug}`;
        console.log(`[Ingestion] Downloading ${slug} from ${baseUrl}...`);
        for (const file of filesToFetch) {
            const filePath = path.join(docPath, file);
            if (fs.existsSync(filePath))
                continue;
            try {
                const res = await fetch(`${baseUrl}/${file}`);
                if (!res.ok) {
                    console.error(`[Ingestion] Failed to fetch ${file}: ${res.statusText}`);
                    return null;
                }
                const buffer = await res.arrayBuffer();
                fs.writeFileSync(filePath, Buffer.from(buffer));
            }
            catch (e) {
                console.error(`[Ingestion] Network error fetching ${file}:`, e);
                return null;
            }
        }
        const indexFile = path.join(docPath, 'index.json');
        const entriesFile = path.join(docPath, 'entries.json');
        if (fs.existsSync(indexFile) && !fs.existsSync(entriesFile)) {
            const indexData = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
            if (indexData.entries) {
                fs.writeFileSync(entriesFile, JSON.stringify(indexData.entries, null, 2));
            }
        }
        return docPath;
    }
    async registerDocSource(packageName, version, docPath, slug) {
        const sourceId = `${packageName}@${version}`;
        await this.sqlite.run(`INSERT OR REPLACE INTO doc_sources(id, name, version, slug, path, is_downloaded, indexed_at) 
       VALUES(?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`, [sourceId, packageName, version, slug, docPath]);
        const entriesFile = path.join(docPath, 'entries.json');
        if (!fs.existsSync(entriesFile)) {
            console.warn(`[Ingestion] entries.json missing for ${sourceId}`);
            return;
        }
        const entries = JSON.parse(fs.readFileSync(entriesFile, 'utf-8'));
        this.sqlite.runNoSave('BEGIN TRANSACTION');
        try {
            for (const entry of entries) {
                const entrySlug = entry.slug || entry.path;
                const entryTitle = entry.title || entry.name;
                if (!entrySlug || !entryTitle)
                    continue;
                const id = `${sourceId}:${entrySlug}`;
                const keywords = entry.keywords ? (Array.isArray(entry.keywords) ? entry.keywords.join(' ') : entry.keywords) : '';
                const params = [id, sourceId, entryTitle, entrySlug, keywords, entry.since || null];
                const safeParams = params.map(p => p === undefined ? null : p);
                this.sqlite.runNoSave(`INSERT OR REPLACE INTO doc_entries(id,source_id,title,slug,keywords,since)
              VALUES(?,?,?,?,?,?)`, safeParams);
            }
            this.sqlite.runNoSave('COMMIT');
            this.sqlite.save();
        }
        catch (e) {
            this.sqlite.runNoSave('ROLLBACK');
            console.error(`[Ingestion] Failed to register entries: ${e.message}`);
        }
        console.log(`[Ingestion] Registered ${entries.length} entries for ${sourceId}`);
    }
    async ingestProjectDocs(projectDeps, devdocsBase) {
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
            }
            else {
                console.error(`Failed to fetch ${pkg}@${actualVer}`);
                results.push({ package: pkg, version: actualVer, status: 'failed' });
            }
        }
        return results;
    }
};
exports.IngestionService = IngestionService;
exports.IngestionService = IngestionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sqlite_service_1.SqliteService])
], IngestionService);

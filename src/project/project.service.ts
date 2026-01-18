import { Injectable } from '@nestjs/common';
import { SqliteService } from '../db/sqlite.service';

@Injectable()
export class ProjectService {
  constructor(private readonly sqlite: SqliteService) {}

  async getProject(id: string) {
    return await this.sqlite.get('SELECT * FROM projects WHERE id=?', [id]);
  }

  async createProject(id: string, name: string, path: string, deps: Record<string, string>, ecosystem: string = 'npm') {
    // 1. Upsert Project
    await this.sqlite.run(
      `INSERT OR REPLACE INTO projects(id,name,path,last_accessed_at) VALUES(?,?,?,CURRENT_TIMESTAMP)`,
      [id, name, path]
    );

    // 2. Upsert Dependencies
    // Using simple transaction style supported by SqlService
    await this.sqlite.runNoSave('BEGIN TRANSACTION');
    try {
        // Clear old deps for this project to ensure sync (simple approach)
        await this.sqlite.runNoSave('DELETE FROM project_dependencies WHERE project_id=?', [id]);

        for (const [pkg, ver] of Object.entries(deps)) {
            await this.sqlite.runNoSave(
                `INSERT INTO project_dependencies(project_id, ecosystem, package_name, version, source) VALUES(?,?,?,?,?)`,
                [id, ecosystem, pkg, ver, 'manual']
            );
        }
        await this.sqlite.runNoSave('COMMIT');
        this.sqlite.save();
    } catch (e) {
        await this.sqlite.runNoSave('ROLLBACK');
        console.error(`Failed to save dependencies for project ${id}:`, e);
    }
    
    // 3. Init default preferences if missing
    await this.sqlite.run(
        `INSERT OR IGNORE INTO project_preferences(project_id) VALUES(?)`,
        [id]
    );

    return { id, name, path, deps };
  }

  async getDeps(id: string): Promise<Record<string, string> | null> {
    const deps = await this.sqlite.query<{package_name: string, version: string}>(
        `SELECT package_name, version FROM project_dependencies WHERE project_id=?`,
        [id]
    );
    
    if (!deps || deps.length === 0) return null;

    const result: Record<string, string> = {};
    for (const dep of deps) {
        result[dep.package_name] = dep.version;
    }
    return result;
  }
}

import { Injectable } from '@nestjs/common';
import { IngestionService } from '../docs/ingestion.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class IngestionTool {
  constructor(private readonly ingestion: IngestionService) {}

  async execute(input: { dependencies: Record<string, string>, devdocsBase?: string }) {
    // Validate input
    if (!input.dependencies || typeof input.dependencies !== 'object' || Object.keys(input.dependencies).length === 0) {
      throw new Error('dependencies must be a non-empty object mapping package names to versions (e.g., {"react": "18.2.0"})');
    }

    // Validate dependency format
    for (const [pkg, ver] of Object.entries(input.dependencies)) {
      if (typeof pkg !== 'string' || pkg.trim().length === 0) {
        throw new Error(`Invalid package name: "${pkg}" must be a non-empty string`);
      }
      if (typeof ver !== 'string' || ver.trim().length === 0) {
        throw new Error(`Invalid version for package "${pkg}": must be a non-empty string`);
      }
    }

    // Get base path for devdocs content
    const base = input.devdocsBase || process.env.DEVDOCS_DATA_PATH || path.join(process.cwd(), 'data');
    
    // Ensure base directory exists and is writable
    try {
      if (!fs.existsSync(base)) {
        fs.mkdirSync(base, { recursive: true });
      }
      // Test write access
      const testFile = path.join(base, '.write_test');
      fs.writeFileSync(testFile, '');
      fs.unlinkSync(testFile);
    } catch (e) {
      throw new Error(`Cannot access data directory at ${base}: ${e.message}. Please ensure the directory exists and is writable.`);
    }

    try {
      const results = await this.ingestion.ingestProjectDocs(input.dependencies, base);
      
      const message = results.map(r => {
        let msg = `${r.package}@${r.version}: ${r.status}`;
        if (r.caveat) msg += ` (Note: ${r.caveat})`;
        return msg;
      }).join('\n');

      return { 
        status: results.every(r => r.status !== 'failed') ? 'success' : 'partial_success', 
        message,
        details: results
      };
    } catch (e) {
      throw new Error(`Documentation ingestion failed: ${e.message}`);
    }
  }
}

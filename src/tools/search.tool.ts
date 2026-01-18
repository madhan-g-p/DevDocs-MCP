import { Injectable } from '@nestjs/common';
import { DocsService } from '../docs/docs.service';
import { ProjectService } from '../project/project.service';
import { SearchInput, SearchResult } from '../types/tools';

@Injectable()
export class SearchTool {
  constructor(
      private readonly docs: DocsService,
      private readonly projectService: ProjectService
  ) {}

  async execute(input: SearchInput): Promise<SearchResult[]> {
    const limit = input.limit || 5;
    
    // 1. Get project context if available
    let projectDeps: Record<string, string> | null = null;
    let packageNames: string[] | undefined = undefined;

    if (input.projectId) {
        projectDeps = await this.projectService.getDeps(input.projectId);
        if (projectDeps) {
            packageNames = Object.keys(projectDeps);
        }
    }

    // 2. Optimized fetch from DB (SQL-level filtering)
    console.log(`[Search] Querying docs for "${input.query}"...`);
    // Debug: Force empty query to get everything if specific keyword
    const dbQuery = input.query === 'FORCE_ALL' ? '' : input.query;
    const entries = await this.docs.getDocEntries(dbQuery, packageNames);
    console.log(`[Search] Found ${entries.length} raw entries in DB.`);
    
    const queryTokens = input.query.toLowerCase().split(/[^a-z0-9]+/);

    const results = entries.map((entry): SearchResult | null => {
      let score = 0;
      if (!entry.title) return null; // Skip invalid entries
      const title = entry.title.toLowerCase();
      
      // 1. Base Score (Max 0.6)
      if (title === input.query.toLowerCase()) {
          score = 0.6; // Exact match baseline
      } else {
          // Token Overlap
          const titleTokens = title.split(/[^a-z0-9]+/);
          const matchedTokens = queryTokens.filter(q => titleTokens.some((t: string) => t.includes(q) || q.includes(t)));
          if (matchedTokens.length > 0) {
              const ratio = matchedTokens.length / Math.max(1, queryTokens.length);
              score = 0.4 * ratio;
          }
      }
      
      // 2. Context Boosting (Max 0.3)
      if (projectDeps) {
          const pkgName = entry.package_name;
          if (projectDeps[pkgName]) {
              score += 0.2; // Relevant package match
              const ver = projectDeps[pkgName];
              if (entry.source_path.includes(ver)) {
                  score += 0.1; // Version matched too
              }
          }
      }

      // 3. Keyword Bonus (Max 0.1)
      const keywords: string[] = entry.keywords ? entry.keywords.split(/\s+/) : [];
      const matchedKeywords = queryTokens.filter(t => keywords.includes(t));
      if (matchedKeywords.length > 0) {
          score += 0.1;
      }

      // Clamp to 1.0 just in case
      score = Math.min(1.0, score);
      
      return { 
          id: entry.id, 
          title: entry.title, 
          source: entry.package_name, 
          score,
          type: 'Entry', 
          path: entry.slug 
      } as SearchResult;
    }).filter((r): r is SearchResult => r !== null);

    return results.sort((a, b) => {
        if (!a || !b) return 0;
        const scoreDiff = b.score - a.score;
        if (Math.abs(scoreDiff) > 0.001) return scoreDiff; 
        return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
    }).slice(0, limit);
  }
}

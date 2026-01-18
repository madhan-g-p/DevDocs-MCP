export interface SearchInput {
  query: string;
  limit?: number;
  projectId?: string; // For context-aware search
}

export interface SearchResult {
  id: string;
  title: string;
  score: number;
  source?: string;
  version?: string; // useful for agent to see
  type?: string;    // e.g., 'Function', 'Class', 'Guide'
  path?: string;    // e.g., 'JavaScript/Standard_Objects/Array/map'
}

export interface ExplainInput {
  docId: string;
}

export interface RelatedInput {
  docId: string;
}

export interface ProjectInput {
  name: string;
  path: string;
  dependencies: Record<string, string>;
  ecosystem?: string;
}

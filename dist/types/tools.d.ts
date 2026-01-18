export interface SearchInput {
    query: string;
    limit?: number;
    projectId?: string;
}
export interface SearchResult {
    id: string;
    title: string;
    score: number;
    source?: string;
    version?: string;
    type?: string;
    path?: string;
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

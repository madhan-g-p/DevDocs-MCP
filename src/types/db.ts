/**
 * Type definitions for database models
 * Provides strong typing for database operations
 */

export interface DocSource {
  id: string;
  name: string;
  version: string;
  slug: string;
  path: string;
  release?: string;
  mtime?: number;
  is_downloaded: number;
  indexed_at?: string;
}

export interface DocEntry {
  id: string;
  source_id: string;
  title: string;
  slug: string;
  keywords?: string;
  since?: string;
}

export interface DocRelationship {
  id: number;
  doc_id: string;
  related_doc_id: string;
  relation_type: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  created_at: string;
  last_accessed_at?: string;
}

export interface ProjectDependency {
  project_id: string;
  ecosystem: string;
  package_name: string;
  version: string;
  source?: string;
}

export interface ProjectPreference {
  project_id: string;
  allow_experimental: number;
  preferred_sources?: string;
  ignored_sources?: string;
  max_search_results: number;
}

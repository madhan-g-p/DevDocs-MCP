# DevDocs MCP Server

## Tagline
Local MCP server for searchable, offline-first DevDocs documentation in AI clients.

## Description
DevDocs MCP Server provides tool-based access to technical documentation from DevDocs through the Model Context Protocol (MCP).  
It focuses on fast local search, cached documentation access, and practical retrieval workflows for coding assistants and developer tools.

This server is intended for developers who want:
- Local documentation lookup from MCP-compatible clients
- Reduced dependency on live web browsing for common docs
- A simple, self-hosted docs retrieval layer

## Setup Requirements
- No paid API key required for basic use.
- Optional environment configuration via `.env` (see project examples):
  - Cache/database path settings (if configured in your environment)
  - Runtime/logging preferences (if configured in your environment)

## Category
Developer Tools

## Features
- Search across indexed DevDocs documentation
- Retrieve documentation content for relevant matches
- Local caching for faster repeat lookups
- MCP tool interface for AI assistant integration
- Lightweight local-server workflow for development environments
- Optional health-check capability for hosted deployments

## Getting Started
- "Search DevDocs for Express middleware examples."
- "Find TypeScript utility types documentation."
- Tool: `search` — Query indexed DevDocs content by keyword/topic.
- Tool: `get_doc` (or equivalent fetch tool in this server) — Retrieve full content/details for a selected result.
- Tool: `health` (if enabled) — Verify server and database readiness.

## Tags
mcp, devdocs, documentation, developer-tools, search, offline, local-server, ai-assistant, docs-retrieval

## Documentation URL
https://github.com/madhan-g-p/DevDocs-MCP/?tab=readme-ov-file

## Health Check URL
For local stdio MCP usage: http://localhost:3000/health 
For hosted deployment: `https://your-server.com/health`
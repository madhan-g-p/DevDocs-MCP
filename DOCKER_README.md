# DevDocs-MCP: Context-Aware Documentation for AI Agents

**Eliminate AI hallucinations with local, version-specific, and authoritative documentation.**

DevDocs-MCP is a **Model Context Protocol (MCP)** server that acts as a bridge between [DevDocs.io](https://devdocs.io) and your AI coding assistants (Claude, RooCode, Cline, etc.). Instead of searching the broad web, it provides precise documentation tailored to the **exact versions** of the tools you are using in your project.

### 🌟 Why This Matters: True Context Awareness
Generic AI tools often hallucinate because they don't know *which* version of a library you are using. They might suggest React 18 hooks for a React 16 project, or Python 3.12 syntax for a 3.8 environment.

**DevDocs-MCP solves this:**
1.  **Project-Aware**: It intelligently maps your queries to the documentation versions matching your project's `package.json` or configuration.
2.  **Deterministic**: It relies on authoritative documentation, not probable text generation.
3.  **Offline-First**: Documentation is cached locally on your machine. No network latency, no data drift.

### 🚀 Quick Start

Run the server with persistent storage (so you don't download docs every time):

```bash
docker run -d -p 3000:3000 \
  -v "$(pwd)/data:/app/data" \
  -e PORT=3000 \
  madhandock1/devdocs-mcp:latest
```

**What this command does:**
*   `-p 3000:3000`: Opens the SSE port for your AI agent to connect.
*   `-v "$(pwd)/data:/app/data"`: **Crucial.** Maps a local folder to the container. This ensures your downloaded documentation and search index (`mcp.db`) are saved on your computer, not lost when the container stops.

### ⚙️ Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port for the SSE server. | `3000` |
| `LOG_LEVEL` | Verbosity of logs (debug, info, warn). | `info` |

### 🔌 Connecting Your Agent

Configure your MCP client (like Claude Desktop or RooCode) to connect via SSE:

*   **URL**: `http://localhost:3000/mcp/sse`

### 🔗 Links
*   **Source Code**: [GitHub Repository](https://github.com/madhan-g-p/DevDocs-MCP)
*   **Issues & Support**: [GitHub Issues](https://github.com/madhan-g-p/DevDocs-MCP/issues)

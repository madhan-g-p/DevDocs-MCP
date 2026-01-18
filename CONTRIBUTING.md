# Contributing to DevDocs-MCP

First off, thank you for considering contributing to DevDocs-MCP! It's people like you who make this tool better for everyone.

## 🛠️ Development Setup

The project is built with NestJS. To get started:

1. **Clone the Repository**:

    ```bash
    git clone https://github.com/madhan-g-p/DevDocs-MCP.git
    cd DevDocs-MCP
    ```

2. **Install Dependencies**:

    ```bash
    pnpm install
    ```

3. **Build the Project**:

    ```bash
    pnpm run build
    ```

4. **Run in Development Mode**:

    ```bash
    pnpm run start:dev
    ```

> **Important:** Contributors must use `pnpm` strictly to avoid dependency issues and ensure consistency.

## 📐 Project Philosophy

- **Zero Native Builds**: This project uses `sql.js` specifically to avoid external toolchain dependencies (no Python/C++ compiler required). Do NOT add libraries that require `node-gyp` or native compilation.
- **Documentation-First**: If you add a new tool, ensure it follows the MCP specification and is clearly documented in `ARCHITECTURE.md`.
- **Input Validation**: All tools must strictly validate inputs. Refer to `src/tools/project.tool.ts` for examples.

## 🧪 Testing

This project is supposed to use Jest for unit and integration testing.

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm run test:watch
```

## 👨‍💻 Code Style

This project uses **ESLint** and **Prettier**. Please ensure your code is formatted before submitting:

```bash
pnpm run format
pnpm run lint
```

## 🚀 Pull Request Process

1. **Fork the Repo**: Create your own fork and work on a feature branch.
2. **Commit Messages**: Follow standard [Conventional Commits](https://www.conventionalcommits.org/).
3. **Documentation**: If you change the architecture or add a feature, update `ARCHITECTURE.md` or `README.md` accordingly.
4. **Self-Review**: Ensure your changes don't break the "Node-only" portability.

**Bad:**

```typescript
const doc = await this.docs.loadDoc(docId);
return doc;
```

### Comments

- Comment **why**, not what
- Keep comments up-to-date with code
- Remove commented-out code before submitting PR

**Good:**

```typescript
// Filter to only project dependencies to reduce search result noise
const entries = await this.docs.getDocEntries(query, packageNames);
```

**Bad:**

```typescript
// Get doc entries
const entries = await this.docs.getDocEntries(query, packageNames);
// const oldEntries = await this.docs.getAllEntries();
```

## File Structure

```dir
src/
├── db/           # Database operations (SQLite)
├── docs/         # Documentation retrieval and ingestion
├── mcp/          # MCP protocol handler
├── project/      # Project context management
├── tools/        # MCP tool implementations
└── types/        # TypeScript type definitions
```

When adding new features:

- Put MCP integrations in `tools/`
- Add types in `types/`
- Add new services in `src/mcp/mcp.service.ts`
- Add tests in  `/feature-name.service.spec.ts`
- You can create additional folders  or files if needed , but cleary specify why it's need in the PR
## Testing

I shall expanding test coverage in future. New features should include tests.

```bash
pnpm test                    # Run all tests
pnpm test -- --watch       # Run in watch mode
pnpm test -- --coverage    # Generate coverage report
```

### Writing Tests Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { SearchTool } from './search.tool';
import { DocsService } from '../docs/docs.service';
import { ProjectService } from '../project/project.service';

describe('SearchTool', () => {
  let tool: SearchTool;
  let docsService: DocsService;
  let projectService: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchTool,
        {
          provide: DocsService,
          useValue: {
            getDocEntries: jest.fn(),
          },
        },
        {
          provide: ProjectService,
          useValue: {
            getDeps: jest.fn(),
          },
        },
      ],
    }).compile();

    tool = module.get<SearchTool>(SearchTool);
    docsService = module.get<DocsService>(DocsService);
    projectService = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(tool).toBeDefined();
  });

  it('should return search results with scores', async () => {
    const mockEntries = [
      {
        id: 'react/hooks',
        title: 'React Hooks',
        keywords: 'useeffect usestate',
        slug: 'hooks',
        package_name: 'react',
        source_path: '/data/react/18.2.0',
      },
      {
        id: 'react/components',
        title: 'React Components',
        keywords: 'props state',
        slug: 'components',
        package_name: 'react',
        source_path: '/data/react/18.2.0',
      },
    ];

    (docsService.getDocEntries as jest.Mock).mockResolvedValue(mockEntries);

    const results = await tool.execute({ query: 'hooks', limit: 5 });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toMatchObject({
      id: 'react/hooks',
      title: 'React Hooks',
      source: 'react',
      type: 'Entry',
    });
    expect(results[0].score).toBeGreaterThan(0.3);
  });

  it('should boost results based on project context', async () => {
    const mockEntries = [
      {
        id: 'node/fs',
        title: 'FileSystem',
        keywords: 'read write',
        slug: 'fs',
        package_name: 'node',
        source_path: '/data/node/20',
      },
    ];

    (docsService.getDocEntries as jest.Mock).mockResolvedValue(mockEntries);
    (projectService.getDeps as jest.Mock).mockResolvedValue({ node: '20' });

    const resultsWithoutContext = await tool.execute({ query: 'fs' });
    const resultsWithContext = await tool.execute({ query: 'fs', projectId: 'my-project' });

    expect(resultsWithContext[0].score).toBeGreaterThan(resultsWithoutContext[0].score);
  });
});
```

## Submitting Changes

### 1. Make Your Changes

```bash
# Edit files
pnpm run format
pnpm run lint
pnpm test
pnpm run build
```

### 2. Commit with Descriptive Messages

```bash
git add src/...
git commit -m "feat: add fuzzy search scoring improvement

- Add keyword boosting for exact term matches
- Add unit tests for scoring algorithm"
```

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `test:` - Tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `chore:` - Build, dependencies, tooling

### 3. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:

- Clear title (e.g., "Add fuzzy search scoring")
- Description of what changed and why
- Link to related issues
- Error logs if applicable

### PR Template

```markdown
## What does this PR do?
Brief description of changes.

## Why?
Explanation of the problem being solved or feature being added.

## Related Issues
Closes #123

## Testing
How to test this change.

## Checklist
- [ ] Code follows style guidelines
- [ ] Formatted with Prettier: `pnpm run format`
- [ ] Passes linting: `pnpm run lint`
- [ ] Tests pass: `pnpm test`
- [ ] Builds successfully: `pnpm run build`
- [ ] Updated docs if needed
```

## Common Tasks

### Adding a New Tool

1. Create `src/tools/my-tool.ts`:

```typescript
import { Injectable } from '@nestjs/common';

export interface MyToolInput {
  query: string;
}

@Injectable()
export class MyTool {
  async execute(input: MyToolInput) {
    // Implementation
    return { result: 'success' };
  }
}
```

1. Add to `src/mcp/mcp.service.ts`:

```typescript
private setupTools() {
  // ... existing tools ...
  
  this.server.registerTool(
    'my_tool',
    {
      description: 'What this tool does',
      inputSchema: z.object({
        query: z.string().describe('Search query'),
      })
    },
    async (args) => {
      const result = await this.myTool.execute(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    }
  );
}
```

1. Add to `McpModule` providers in `src/mcp/mcp.module.ts`

2. Write tests in `src/tools/__tests__/my-tool.spec.ts`

### Updating Documentation

Edit markdown files in root directory:

- `README.md` - Main overview
- `ARCHITECTURE.md` - Technical architecture
- `CONTRIBUTING.md` - This file

### Fixing a Bug

1. Create an issue describing the bug
2. Create a test that reproduces it
3. Fix the bug
4. Verify the test now passes
5. Submit PR referencing the issue

## Performance Considerations

- Use database queries efficiently (avoid N+1 queries)
- Cache frequently accessed data
- Implement pagination for large result sets
- Profile performance-critical paths

## Security

- Validate all user inputs
- Sanitize file paths to prevent directory traversal
- Don't log sensitive information
- Keep dependencies updated

## Documentation

Every public function/class should have JSDoc comments:

```typescript
/**
 * Search documentation entries by query string
 * 
 * @param query The search query (e.g., "react hooks")
 * @param limit Maximum number of results to return
 * @param projectId Optional project ID for context filtering
 * @returns Array of matching documentation entries sorted by relevance
 * @throws Error if search fails
 */
async search(
  query: string,
  limit?: number,
  projectId?: string
): Promise<SearchResult[]> {
  // Implementation
}
```

## Releases

Releases follow semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

## Support & Questions

- 💬 Open an issue to ask questions
- 💡 Discuss ideas in GitHub Discussions
- 📖 Check these first in the following order  
    1. [README.md](README.md)
    2. [ARCHITECTURE.md](ARCHITECTURE.md) 
    3. [Issues](https://github.com/madhan-g-p/DevDocs-MCP/issues)
    4. [Pull Requests](https://github.com/madhan-g-p/DevDocs-MCP/pulls)

## What This Project is Looking For

- Bug fixes and performance improvements
- Documentation improvements
- New documentation source integrations
- Better error messages
- Unit tests
- Better fuzzy search scoring
- Support for additional package ecosystems

## What I am not planning to implement in this project

- Changes that make this a web scraper
- Changes that circumvent [DevDocs.io's](https://github.com/freeCodeCamp/devdocs) [Copyright](https://github.com/freeCodeCamp/devdocs/blob/main/COPYRIGHT)  or [License](https://github.com/freeCodeCamp/devdocs?tab=MPL-2.0-1-ov-file)
- Hardcoded API keys or credentials
- Massive changes without prior discussion

**_Reason:_** Implementing any of the above changes or related code modifications would effectively turn this project into a web scraper, which is not its intended purpose. This project is designed to provide a standardized intermediate format for web development documentation that AI agents can understand. Its goal is to serve as a conceptual framework for internal project documentation, following a structure similar to DevDocs, and to improve communication with AI agents rather than scrape content from external sources.

---

**_Thanks for contributing! 🎉_**

Let me know if you have any questions by opening an issue.

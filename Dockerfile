# Build Stage
FROM node:20-slim AS builder

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependency definitions
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Prune dev dependencies
RUN pnpm prune --prod

# Production Stage
FROM node:20-slim

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create data directory for volume mounting
RUN mkdir -p data

# Define volume for persistent data
VOLUME ["/app/data"]

# Set environment variables
ENV NODE_ENV=production
ENV DEVDOCS_DATA_PATH=./data
ENV MCP_DB_PATH=./data/mcp.db

# Expose port 3000 for SSE mode
EXPOSE 3000

# Default command starts in Prod mode with HTTP server if PORT is set, or Stdio if not.
# By default, we can set it to run node dist/main.js
CMD ["node", "dist/main.js"]

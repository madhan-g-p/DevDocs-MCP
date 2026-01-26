# STAGE 1: Build Stage (Node 24 is recommended for 2026 compatibility)
FROM node:24-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# --- CRITICAL FIX FOR DIRECTORIES ---
# Create the data directory here while we have a shell
RUN mkdir -p data/docs && chown -R 65532:65532 data

# Prune dependencies
RUN rm -rf node_modules && pnpm install --prod --frozen-lockfile --ignore-scripts


# STAGE 2: Runner Stage
FROM cgr.dev/chainguard/node:latest-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DEVDOCS_DATA_PATH=/app/data/docs
ENV MCP_DB_PATH=/app/data/mcp.db

# Copy artifacts with --chown to avoid needing 'RUN chown' in the final stage
# Note: 65532 is the UID/GID for the 'node' user in Chainguard images
COPY --from=builder --chown=65532:65532 /app/node_modules ./node_modules
COPY --from=builder --chown=65532:65532 /app/dist ./dist
COPY --from=builder --chown=65532:65532 /app/package.json ./
# We copy the already-prepared data directory from builder
COPY --from=builder --chown=65532:65532 /app/data ./data

# Switch to the non-root 'node' user immediately
USER node

EXPOSE 3000

# Healthcheck without a shell
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:3000/mcp/sse').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]

# Use absolute path for safety in distroless
ENTRYPOINT ["/usr/bin/node", "dist/main.js"]

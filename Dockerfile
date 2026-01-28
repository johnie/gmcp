# GMCP Server Dockerfile
# Multi-stage build following Bun best practices

FROM oven/bun:1 AS base
WORKDIR /app

# Install production dependencies only
FROM base AS install
COPY package.json bun.lock ./
# --ignore-scripts: Skip prepare script (lefthook needs git)
# --frozen-lockfile: Ensure lockfile matches
# --production: Exclude devDependencies
RUN bun install --frozen-lockfile --ignore-scripts --production

# Release stage
FROM base AS release

# Set production environment
ENV NODE_ENV=production

# Copy production node_modules
COPY --from=install /app/node_modules ./node_modules

# Copy source and config files
# tsconfig.json required for @/ path alias resolution at runtime
COPY src ./src
COPY tsconfig.json package.json ./

# Create data directory for credentials and tokens
RUN mkdir -p /app/data

# Run as non-root user (bun user exists in base image)
USER bun

# Run MCP server
CMD ["bun", "run", "src/index.ts"]

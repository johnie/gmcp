# Gmail MCP Server Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source files
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Set environment variables (override these when running)
ENV GMAIL_CREDENTIALS_PATH=/app/data/credentials.json
ENV GMAIL_TOKEN_PATH=/app/data/token.json
ENV GMAIL_SCOPES=gmail.readonly

# Create data directory for credentials and tokens
RUN mkdir -p /app/data

# Run the MCP server
CMD ["bun", "run", "src/index.ts"]

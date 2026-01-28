# GMCP Server Dockerfile
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
ENV GOOGLE_CREDENTIALS_PATH=/app/data/credentials.json
ENV GOOGLE_TOKEN_PATH=/app/data/token.json
ENV GOOGLE_SCOPES=gmail.readonly,calendar.readonly

# Create data directory for credentials and tokens
RUN mkdir -p /app/data

# Run the MCP server
CMD ["bun", "run", "src/index.ts"]

# GMCP Server Dockerfile
# Multi-stage build: compile to standalone binary, run on distroless

FROM oven/bun:1 AS build
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source and config
COPY src ./src
COPY tsconfig.json ./

# Compile to standalone binary with version injected
ARG VERSION=0.0.0
RUN bun build --compile --minify \
    --define "__GMCP_VERSION__='\"${VERSION}\"'" \
    ./src/index.ts --outfile /app/gmcp-server

# Minimal runtime image
FROM gcr.io/distroless/cc-debian12

COPY --from=build /app/gmcp-server /gmcp-server

# Run as non-root (distroless nonroot user)
USER 65532

ENTRYPOINT ["/gmcp-server"]

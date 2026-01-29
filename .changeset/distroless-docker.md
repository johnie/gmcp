---
"gmcp": patch
---

## Docker Image Optimization: 71% Size Reduction

Switch from runtime interpretation to compiled binary on distroless base image.

### Before → After

| Metric | Old | New |
|--------|-----|-----|
| **Image size** | 496 MB | 144 MB |
| **Base image** | oven/bun:1 (227 MB) | distroless/cc-debian12 (32.6 MB) |
| **Runtime** | Bun + node_modules | Standalone binary |
| **User** | bun | 65532 (non-root) |

### What Changed

- **Dockerfile**: Multi-stage build compiles to standalone binary with `bun build --compile --minify`
- **Runtime**: Distroless image (no shell, no package manager, minimal attack surface)
- **Version injection**: Build-time constant via `--define "__GMCP_VERSION__"`
- **CI/CD**: Release workflow passes VERSION build arg to Docker build

### Benefits

- **352 MB smaller** images (faster pulls, less storage)
- **Improved security**: No shell access, non-root execution, minimal CVE surface
- **Faster startup**: Pre-compiled binary vs TypeScript compilation at runtime
- **Tree-shaken**: Dependencies bundled and minified, unused code removed

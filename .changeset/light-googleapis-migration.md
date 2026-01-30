---
"gmcp": minor
---

### Replaced monolithic `googleapis` with lightweight specific packages

Migrated from the full `googleapis` package to individual API-specific packages, achieving a **98% reduction in dependency size**.

#### Bundle Size Comparison

| Package | Size |
|---------|------|
| `googleapis` (before) | **~199 MB** |
| `@googleapis/gmail` | 1.0 MB |
| `@googleapis/calendar` | 0.9 MB |
| `google-auth-library` | 0.7 MB |
| **Total (after)** | **~2.75 MB** |

**Savings: ~196 MB**

#### What Changed

- Replaced `googleapis` with `@googleapis/gmail` and `@googleapis/calendar`
- OAuth2 client now uses `google-auth-library` directly
- All APIs remain identical - this is a drop-in replacement with no breaking changes

#### Benefits

- Faster `npm install` / `bun install` times
- Smaller Docker images
- Reduced cold start times in serverless environments
- Lower disk usage

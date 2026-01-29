---
"gmcp": patch
---

## Structured Error Handling and Schema Consolidation

This release introduces custom error classes for better error handling and consolidates duplicate schema definitions across the codebase.

### New Features

- **Custom Error Classes** (`src/errors.ts`)
  - `GmcpError`: Base error class with typed error codes
  - `ConfigurationError`: For missing/invalid environment variables and config files
  - `AuthError`: For authentication failures (missing tokens, invalid credentials)
  - `GoogleApiError`: For Gmail/Calendar API failures with service and operation tracking

- **Gmail System Label Constants** (`src/constants.ts`)
  - `GMAIL_SYSTEM_LABELS`: Complete list of system labels that cannot be deleted
  - `GMAIL_CORE_SYSTEM_LABELS`: Subset of labels that cannot be renamed
  - Type exports for type-safe label validation

- **Shared Schemas** (`src/schemas/shared.ts`)
  - `AttachmentOutputFormatSchema`: Reusable schema for attachment output format

### Refactoring

- **Auth module**: Now uses `AuthError` and `ConfigurationError` instead of generic `Error`
- **Gmail client**: All API failures now throw `GoogleApiError` with service/operation context
- **Calendar client**: Uses `GoogleApiError` and extracts `buildEventDateTime` helper
- **Tool files**: All 21 tool files now use shared `OutputFormatSchema` from `schemas/shared.ts`
- **Label tools**: Use centralized system label constants instead of inline arrays

### Commits

| Hash | Message |
|------|---------|
| `1fb9663` | feat(errors): add custom error classes for structured error handling |
| `d06da9e` | feat(constants): add Gmail system label constants |
| `5f1a4c3` | feat(schemas): add AttachmentOutputFormatSchema |
| `d317699` | refactor(auth): use custom error classes |
| `0385144` | refactor(gmail): use GoogleApiError for API failures |
| `129e8aa` | refactor(calendar): use GoogleApiError and extract buildEventDateTime |
| `5d702e2` | refactor(tools): use centralized system label constants |
| `48b610b` | refactor(tools): use shared OutputFormatSchema |

### Files Changed

- 27 files changed, +366 insertions, -168 deletions
- New file: `src/errors.ts` (90 lines)

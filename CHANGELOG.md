# gmcp

## 0.7.0

### Minor Changes

- [#28](https://github.com/johnie/gmcp/pull/28) [`40f1489`](https://github.com/johnie/gmcp/commit/40f1489326ca962865c922adcb595f14b54a8a04) Thanks [@johnie](https://github.com/johnie)! - ## Improved OAuth2 Authentication Flow

  This release significantly improves the OAuth2 authentication experience with an automatic local callback server.

  ### New Features

  - **Local OAuth Callback Server**: Authentication now automatically starts a local server to receive the OAuth callback, eliminating the need to manually copy authorization codes
  - **Auto Browser Launch**: Opens the authorization URL in your default browser automatically (macOS, Linux, Windows)
  - **Styled Response Pages**: Beautiful monospace-styled success and error pages displayed after authentication
  - **Headless Detection**: Automatically detects CI/SSH environments and adjusts behavior accordingly
  - **Manual Mode Fallback**: Use `--manual` or `-m` flag to fall back to the previous copy-paste workflow

  ### Changes

  - `bun run auth` - Now uses automatic local callback server (default)
  - `bun run auth --manual` - Uses manual code input (fallback)

  ### Commits

  - `feat(cli)`: add --manual flag to auth command
  - `feat(auth)`: implement local OAuth callback server
  - `feat(auth)`: add normalizeRedirectUri and configurable redirect URI
  - `docs`: prefer interface over type for object types

## 0.6.0

### Minor Changes

- [#26](https://github.com/johnie/gmcp/pull/26) [`dbd1f96`](https://github.com/johnie/gmcp/commit/dbd1f96f8f912fa1e56f3aa3d05f7f54afdc0fba) Thanks [@johnie](https://github.com/johnie)! - ### Replaced monolithic `googleapis` with lightweight specific packages

  Migrated from the full `googleapis` package to individual API-specific packages, achieving a **98% reduction in dependency size**.

  #### Bundle Size Comparison

  | Package                | Size         |
  | ---------------------- | ------------ |
  | `googleapis` (before)  | **~199 MB**  |
  | `@googleapis/gmail`    | 1.0 MB       |
  | `@googleapis/calendar` | 0.9 MB       |
  | `google-auth-library`  | 0.7 MB       |
  | **Total (after)**      | **~2.75 MB** |

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

## 0.5.2

### Patch Changes

- [#24](https://github.com/johnie/gmcp/pull/24) [`dcf2446`](https://github.com/johnie/gmcp/commit/dcf24469ac222c7621fd5ceec58cf2100cf9da18) Thanks [@johnie](https://github.com/johnie)! - ## Docker Image Optimization: 71% Size Reduction

  Switch from runtime interpretation to compiled binary on distroless base image.

  ### Before → After

  | Metric         | Old                 | New                              |
  | -------------- | ------------------- | -------------------------------- |
  | **Image size** | 496 MB              | 144 MB                           |
  | **Base image** | oven/bun:1 (227 MB) | distroless/cc-debian12 (32.6 MB) |
  | **Runtime**    | Bun + node_modules  | Standalone binary                |
  | **User**       | bun                 | 65532 (non-root)                 |

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

## 0.5.1

### Patch Changes

- [#21](https://github.com/johnie/gmcp/pull/21) [`1d5c855`](https://github.com/johnie/gmcp/commit/1d5c8554052dcc31c85ae99d2258ce6bc29676b9) Thanks [@johnie](https://github.com/johnie)! - ## Structured Error Handling and Schema Consolidation

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

  | Hash      | Message                                                               |
  | --------- | --------------------------------------------------------------------- |
  | `1fb9663` | feat(errors): add custom error classes for structured error handling  |
  | `d06da9e` | feat(constants): add Gmail system label constants                     |
  | `5f1a4c3` | feat(schemas): add AttachmentOutputFormatSchema                       |
  | `d317699` | refactor(auth): use custom error classes                              |
  | `0385144` | refactor(gmail): use GoogleApiError for API failures                  |
  | `129e8aa` | refactor(calendar): use GoogleApiError and extract buildEventDateTime |
  | `5d702e2` | refactor(tools): use centralized system label constants               |
  | `48b610b` | refactor(tools): use shared OutputFormatSchema                        |

  ### Files Changed

  - 27 files changed, +366 insertions, -168 deletions
  - New file: `src/errors.ts` (90 lines)

## 0.5.0

### Minor Changes

- [#18](https://github.com/johnie/gmcp/pull/18) [`60e8da6`](https://github.com/johnie/gmcp/commit/60e8da66af11a6f122b45af2bb7481c6c57df2f8) Thanks [@johnie](https://github.com/johnie)! - Add `gmcp_gmail_archive_email` tool for archiving emails by removing them from the inbox.

  **Commits:**

  - feat(gmail): add archive email tool

  **What's new:**

  - New `gmcp_gmail_archive_email` tool that archives emails by removing the INBOX label
  - Archived emails remain accessible in "All Mail" and can be unarchived
  - Requires `gmail.modify` scope
  - Marked with MODIFY_ANNOTATIONS (not destructive, since operation is reversible)

## 0.4.0

### Minor Changes

- [#16](https://github.com/johnie/gmcp/pull/16) [`b62fde8`](https://github.com/johnie/gmcp/commit/b62fde8705bc09f95577784c6e236c453176d6d1) Thanks [@johnie](https://github.com/johnie)! - Add `gmcp_gmail_delete_email` tool for permanently deleting emails from Gmail.

  **Commits:**

  - feat(gmail): add delete email tool
  - chore(deps): update pino, biome, lefthook, ultracite
  - docs: add delete email tool to README

  **What's new:**

  - New `gmcp_gmail_delete_email` tool that permanently deletes emails (bypasses trash)
  - Requires `gmail.modify` scope
  - Marked as destructive operation with appropriate MCP annotations

## 0.3.0

### Minor Changes

- [#14](https://github.com/johnie/gmcp/pull/14) [`7342f28`](https://github.com/johnie/gmcp/commit/7342f2851c2e30236501e172061bfc4f6ebe4d7f) Thanks [@johnie](https://github.com/johnie)! - Replace hand-rolled CLI with Stricli framework for improved type safety and maintainability. The auth command now uses Inquirer prompts for better UX with built-in validation and visual feedback during the OAuth flow.

## 0.2.1

### Patch Changes

- [#12](https://github.com/johnie/gmcp/pull/12) [`545738c`](https://github.com/johnie/gmcp/commit/545738c13ec8c6c2c92c2abb0b4342f6c97e5ec8) Thanks [@johnie](https://github.com/johnie)! - Unify CLI commands into single `gmcp` entry point

  - `npx gmcp` or `npx gmcp start` - Start the MCP server (default)
  - `npx gmcp auth` - Run OAuth2 authentication flow
  - `npx gmcp --help` - Show usage information
  - `npx gmcp --version` - Show version number

  The previous `gmcp-auth` command has been removed. Use `gmcp auth` instead.

  Version is now dynamically read from package.json for consistent reporting.

## 0.2.0

### Minor Changes

- [#9](https://github.com/johnie/gmcp/pull/9) [`8f7190a`](https://github.com/johnie/gmcp/commit/8f7190a46ed68d570a9eab34801aa1909cc2b86e) Thanks [@johnie](https://github.com/johnie)! - Add unified release workflow with Changesets, NPM publishing, and Docker Hub integration

  - Changesets manages versioning and changelog generation
  - NPM package published automatically on version merge
  - Docker images built and pushed with semver tags
  - GitHub Releases created with install instructions

# gmcp

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

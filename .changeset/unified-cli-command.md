---
"gmcp": patch
---

Unify CLI commands into single `gmcp` entry point

- `npx gmcp` or `npx gmcp start` - Start the MCP server (default)
- `npx gmcp auth` - Run OAuth2 authentication flow
- `npx gmcp --help` - Show usage information
- `npx gmcp --version` - Show version number

The previous `gmcp-auth` command has been removed. Use `gmcp auth` instead.

Version is now dynamically read from package.json for consistent reporting.

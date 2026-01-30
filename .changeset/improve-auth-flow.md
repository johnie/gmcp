---
"gmcp": minor
---

## Improved OAuth2 Authentication Flow

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

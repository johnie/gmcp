# Gmail MCP Server

Model Context Protocol (MCP) server for Gmail API with OAuth2 authentication. Enables LLMs to search and interact with Gmail messages for Google Workspace accounts.

## Features

- **OAuth2 Desktop Client Authentication**: Secure OAuth2 flow for desktop applications
- **Configurable Scopes**: Easily define Gmail API scopes via environment variables
- **Stdio Transport**: Standard MCP stdio transport for seamless integration
- **Gmail Search**: Search emails using Gmail's powerful query syntax
- **Docker Support**: Build and run as a Docker container
- **Built with Bun**: Fast TypeScript runtime with zero-config

## Prerequisites

1. **Google Cloud Project** with Gmail API enabled
2. **OAuth 2.0 Client ID** (Desktop Application type)
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Create OAuth 2.0 Client ID → Desktop Application
   - Download credentials JSON file

## Quick Start

### 1. Installation

```bash
# Clone or navigate to the project
cd gmcp

# Install dependencies
bun install

# Copy environment template
cp .env.example .env
```

### 2. Configuration

Edit `.env` file:

```bash
GMAIL_CREDENTIALS_PATH=/path/to/credentials.json
GMAIL_TOKEN_PATH=/path/to/token.json
GMAIL_SCOPES=gmail.readonly
```

### 3. Authentication

Run the OAuth flow to obtain tokens:

```bash
bun run auth
```

This will:
1. Display an authorization URL
2. Visit the URL in your browser and authorize the app
3. After authorizing, you'll be redirected to `localhost` (which shows "connection refused" - **this is expected!**)
4. Copy the authorization code from the URL in your browser's address bar
   - The URL looks like: `http://localhost:PORT/?code=YOUR_CODE&scope=...`
   - Copy the entire string after `code=` (before `&scope`)
5. Paste the code into the terminal
6. Tokens will be saved to `GMAIL_TOKEN_PATH`

### 4. Run the Server

```bash
bun run start
```

The server will start and listen for MCP requests via stdio.

## Gmail Scopes

Configure scopes in `.env` using short names (comma-separated):

| Short Name | Full URL | Description |
|------------|----------|-------------|
| `gmail.readonly` | `https://www.googleapis.com/auth/gmail.readonly` | Read-only access |
| `gmail.modify` | `https://www.googleapis.com/auth/gmail.modify` | Read, create, update, delete |
| `gmail.send` | `https://www.googleapis.com/auth/gmail.send` | Send messages |
| `gmail.labels` | `https://www.googleapis.com/auth/gmail.labels` | Manage labels |
| `gmail.metadata` | `https://www.googleapis.com/auth/gmail.metadata` | Read metadata only |
| `gmail.compose` | `https://www.googleapis.com/auth/gmail.compose` | Create drafts and send |
| `gmail.insert` | `https://www.googleapis.com/auth/gmail.insert` | Insert messages |
| `gmail.settings.basic` | `https://www.googleapis.com/auth/gmail.settings.basic` | Manage basic settings |
| `gmail.settings.sharing` | `https://www.googleapis.com/auth/gmail.settings.sharing` | Manage sharing settings |

**Examples**:
```bash
# Read-only (default)
GMAIL_SCOPES=gmail.readonly

# Read and modify
GMAIL_SCOPES=gmail.readonly,gmail.modify

# Send emails only
GMAIL_SCOPES=gmail.send

# Full access
GMAIL_SCOPES=gmail.readonly,gmail.modify,gmail.send,gmail.labels
```

## MCP Tools

### `gmail_search_emails`

Search for emails using Gmail's search syntax.

**Parameters**:
- `query` (string, required): Gmail search query
- `max_results` (number, optional): Maximum results (1-100, default: 10)
- `include_body` (boolean, optional): Include full email body (default: false)
- `page_token` (string, optional): Token for pagination

**Gmail Search Operators**:
- `from:user@example.com` - Emails from sender
- `to:user@example.com` - Emails to recipient
- `subject:keyword` - Subject contains keyword
- `is:unread` - Unread emails
- `is:starred` - Starred emails
- `has:attachment` - Has attachments
- `after:2024/01/01` - After date
- `before:2024/12/31` - Before date
- `label:labelname` - With label
- `filename:pdf` - Specific file type
- `larger:5M` - Larger than size
- `newer_than:7d` - Newer than duration

**Example Queries**:
```json
{
  "query": "is:unread"
}

{
  "query": "from:boss@company.com subject:urgent",
  "max_results": 20
}

{
  "query": "has:attachment newer_than:7d",
  "include_body": true
}
```

**Returns**:
- `total_estimate`: Approximate total matches
- `count`: Number of results in response
- `has_more`: Whether more results available
- `next_page_token`: Token for next page (if applicable)
- `emails`: Array of email objects

## Docker Usage

### Build Image

```bash
docker build -t gmail-mcp-server .
```

### Run with Docker

```bash
docker run -i \
  -v /path/to/credentials.json:/app/data/credentials.json:ro \
  -v /path/to/token.json:/app/data/token.json \
  -e GMAIL_CREDENTIALS_PATH=/app/data/credentials.json \
  -e GMAIL_TOKEN_PATH=/app/data/token.json \
  -e GMAIL_SCOPES=gmail.readonly \
  gmail-mcp-server
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  gmail-mcp:
    build: .
    stdin_open: true
    volumes:
      - ./credentials.json:/app/data/credentials.json:ro
      - ./token.json:/app/data/token.json
    environment:
      - GMAIL_CREDENTIALS_PATH=/app/data/credentials.json
      - GMAIL_TOKEN_PATH=/app/data/token.json
      - GMAIL_SCOPES=gmail.readonly
```

## Testing with MCP Inspector

```bash
bunx @modelcontextprotocol/inspector bun run start
```

## Development

```bash
# Install dependencies
bun install

# Run server
bun run start

# Run auth CLI
bun run auth
```

## Project Structure

```
gmcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── auth.ts           # OAuth2 authentication module
│   ├── auth-cli.ts       # OAuth CLI tool
│   ├── gmail.ts          # Gmail API wrapper
│   ├── tools/
│   │   └── search.ts     # gmail_search_emails tool
│   └── types.ts          # TypeScript interfaces
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

## Troubleshooting

### "This site can't be reached" / "localhost refused to connect"

This is **expected behavior** during OAuth authentication! When Google redirects you after authorization, the browser tries to connect to `localhost`, but there's no server running to catch it.

**Solution**: Don't worry about the error. Instead:
1. Look at the URL in your browser's address bar
2. Find the `code=` parameter in the URL
3. Copy the entire authorization code (the long string after `code=`)
4. Paste it into the terminal where `bun run auth` is waiting

Example URL:
```
http://localhost:9999/?code=4/0AY0e-g7xXXXXXX&scope=https://www.googleapis.com/auth/gmail.readonly
```
Copy: `4/0AY0e-g7xXXXXXX`

### "No tokens found" Error

Run `bun run auth` to complete the OAuth flow and generate tokens.

### "Invalid grant" Error

Your tokens may have expired or been revoked. Run `bun run auth` again to re-authenticate.

### "Insufficient Permission" Error

The requested operation requires additional scopes. Update `GMAIL_SCOPES` in `.env` and re-authenticate with `bun run auth`.

## Security Notes

- Never commit `credentials.json` or `token.json` to version control
- Store credentials securely
- Use read-only scopes unless write access is required
- Regularly review authorized applications in [Google Account Settings](https://myaccount.google.com/permissions)

## License

MIT

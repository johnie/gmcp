# GMCP

MCP (Model Context Protocol) server for Google services. Currently supports Gmail with 10 tools for email management. More Google services coming soon.

Built with Bun and TypeScript.

## Gmail Tools

| Tool | Description |
|------|-------------|
| `gmcp_gmail_search_emails` | Search emails using Gmail query syntax |
| `gmcp_gmail_get_email` | Get single email by message ID |
| `gmcp_gmail_get_thread` | Get entire conversation thread |
| `gmcp_gmail_list_attachments` | List all attachments on a message |
| `gmcp_gmail_get_attachment` | Download attachment data by ID |
| `gmcp_gmail_modify_labels` | Add/remove labels on a message |
| `gmcp_gmail_batch_modify` | Batch label operations on multiple messages |
| `gmcp_gmail_send_email` | Send email (preview + confirm safety) |
| `gmcp_gmail_reply` | Reply to email in thread (preview + confirm) |
| `gmcp_gmail_create_draft` | Create draft message |

## Setup

### Prerequisites

1. **Google Cloud Project** with Gmail API enabled
2. **OAuth 2.0 Client ID** (Desktop Application type)
   - Create at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Download credentials JSON file

### Install & Configure

```bash
# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Edit .env with your paths
# GMAIL_CREDENTIALS_PATH=/path/to/credentials.json
# GMAIL_TOKEN_PATH=/path/to/token.json
# GMAIL_SCOPES=gmail.readonly
```

### Authenticate

Run the OAuth flow to obtain tokens:

```bash
bun run auth
```

Follow the prompts:
1. Visit the authorization URL in your browser
2. Authorize the app
3. Copy the authorization code from the redirected URL
4. Paste it in the terminal

The browser will show "connection refused" after authorization - **this is expected**. Just copy the `code=` parameter from the URL.

### Run the Server

```bash
bun run start
```

The server runs via stdio and is ready to accept MCP requests.

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GMAIL_CREDENTIALS_PATH` | Path to OAuth2 credentials JSON from Google Cloud Console |
| `GMAIL_TOKEN_PATH` | Path where OAuth2 tokens will be stored |
| `GMAIL_SCOPES` | Comma-separated Gmail API scopes (short names or full URLs) |

### Gmail Scopes

| Short Name | Description | Required For |
|------------|-------------|--------------|
| `gmail.readonly` | Read-only access | Search, get email, get thread, list/get attachments |
| `gmail.modify` | Read, create, update, delete | Label operations |
| `gmail.send` | Send messages | Send email, reply |
| `gmail.compose` | Create drafts and send | Send email, reply, create draft |
| `gmail.labels` | Manage labels | Label operations |

**Examples**:
```bash
# Read-only (default)
GMAIL_SCOPES=gmail.readonly

# Read and send
GMAIL_SCOPES=gmail.readonly,gmail.send

# Full access
GMAIL_SCOPES=gmail.readonly,gmail.modify,gmail.send
```

## Claude Desktop Integration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "gmcp": {
      "command": "bun",
      "args": ["run", "/path/to/gmcp/src/index.ts"],
      "env": {
        "GMAIL_CREDENTIALS_PATH": "/path/to/credentials.json",
        "GMAIL_TOKEN_PATH": "/path/to/token.json",
        "GMAIL_SCOPES": "gmail.readonly,gmail.send"
      }
    }
  }
}
```

## Docker

Run with Docker:

```bash
docker build -t gmcp-server .
docker run -i \
  -v /path/to/credentials.json:/app/data/credentials.json:ro \
  -v /path/to/token.json:/app/data/token.json \
  -e GMAIL_CREDENTIALS_PATH=/app/data/credentials.json \
  -e GMAIL_TOKEN_PATH=/app/data/token.json \
  -e GMAIL_SCOPES=gmail.readonly \
  gmcp-server
```

## Testing

Test with MCP Inspector:

```bash
bunx @modelcontextprotocol/inspector bun run start
```

## Roadmap

Currently supports Gmail. More Google services (Calendar, Drive, Sheets, etc.) planned for future releases.

## License

MIT

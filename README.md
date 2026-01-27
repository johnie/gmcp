# GMCP

MCP (Model Context Protocol) server for Google services. Provides Gmail and Google Calendar integration with 19 tools for email management and calendar operations.

## Gmail Tools

### Email Operations

| Tool | Description |
|------|-------------|
| `gmcp_gmail_search_emails` | Search emails using Gmail query syntax |
| `gmcp_gmail_get_email` | Get single email by message ID |
| `gmcp_gmail_get_thread` | Get entire conversation thread |
| `gmcp_gmail_list_attachments` | List all attachments on a message |
| `gmcp_gmail_get_attachment` | Download attachment data by ID |
| `gmcp_gmail_send_email` | Send email (preview + confirm safety) |
| `gmcp_gmail_reply` | Reply to email in thread (preview + confirm) |
| `gmcp_gmail_create_draft` | Create draft message |

### Label Management

| Tool | Description |
|------|-------------|
| `gmcp_gmail_list_labels` | List all Gmail labels (system + custom) |
| `gmcp_gmail_get_label` | Get label details and message counts |
| `gmcp_gmail_create_label` | Create custom label with visibility/color settings |
| `gmcp_gmail_update_label` | Update label name, visibility, or color |
| `gmcp_gmail_delete_label` | Delete custom label (system labels protected) |
| `gmcp_gmail_modify_labels` | Add/remove labels on a message |
| `gmcp_gmail_batch_modify` | Batch label operations on multiple messages |

## Calendar Tools

| Tool | Description |
|------|-------------|
| `gmcp_calendar_list_calendars` | List all calendars for account |
| `gmcp_calendar_list_events` | List events with filters (time range, query, calendar) |
| `gmcp_calendar_get_event` | Get single event by ID |
| `gmcp_calendar_create_event` | Create event (supports recurring events, Google Meet) |

## Setup

### Prerequisites

1. **Google Cloud Project** with Gmail API and Calendar API enabled
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
# GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json
# GOOGLE_TOKEN_PATH=/path/to/token.json
# GOOGLE_SCOPES=gmail.readonly,calendar.readonly
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
| `GOOGLE_CREDENTIALS_PATH` | Path to OAuth2 credentials JSON from Google Cloud Console |
| `GOOGLE_TOKEN_PATH` | Path where OAuth2 tokens will be stored |
| `GOOGLE_SCOPES` | Comma-separated Gmail and Calendar API scopes (short names or full URLs) |

### Gmail Scopes

| Short Name | Description | Required For |
|------------|-------------|--------------|
| `gmail.readonly` | Read-only access | Search, get email, get thread, list/get attachments, list labels, get label |
| `gmail.modify` | Read, create, update, delete | Modify labels, batch modify |
| `gmail.labels` | Manage labels | Create label, update label, delete label, modify labels, batch modify |
| `gmail.send` | Send messages | Send email, reply |
| `gmail.compose` | Create drafts and send | Send email, reply, create draft |

### Calendar Scopes

| Short Name | Description | Required For |
|------------|-------------|--------------|
| `calendar.readonly` | Read-only calendar access | List calendars, list events, get event |
| `calendar.events.readonly` | Read-only events access | List events, get event |
| `calendar.events` | Manage events | Create event, list events, get event |
| `calendar` | Full calendar access | All calendar tools |

### Scope Examples

```bash
# Gmail read-only
GOOGLE_SCOPES=gmail.readonly

# Gmail and Calendar read-only
GOOGLE_SCOPES=gmail.readonly,calendar.readonly

# Gmail read/send + Calendar read/create
GOOGLE_SCOPES=gmail.readonly,gmail.send,calendar.events

# Full access (all tools)
GOOGLE_SCOPES=gmail.readonly,gmail.modify,gmail.send,gmail.labels,calendar
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
        "GOOGLE_CREDENTIALS_PATH": "/path/to/credentials.json",
        "GOOGLE_TOKEN_PATH": "/path/to/token.json",
        "GOOGLE_SCOPES": "gmail.readonly,gmail.send,gmail.labels,calendar.events"
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
  -e GOOGLE_CREDENTIALS_PATH=/app/data/credentials.json \
  -e GOOGLE_TOKEN_PATH=/app/data/token.json \
  -e GOOGLE_SCOPES=gmail.readonly,gmail.labels,gmail.send,calendar.events \
  gmcp-server
```

## Testing

Test with MCP Inspector:

```bash
bunx @modelcontextprotocol/inspector bun run start
```

## Future Enhancements

Potential additions include Google Drive, Google Sheets, and other Google Workspace services.

## License

MIT

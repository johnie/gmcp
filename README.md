<p align="center">
  <h1 align="center">🔗<br/><code>gmcp</code></h1>
  <p align="center">MCP server for Gmail and Google Calendar integration.
    <br/>
    by <a href="https://github.com/johnie">@johnie</a>
  </p>
</p>
<br/>

<p align="center">
<a href="https://www.npmjs.com/package/gmcp" rel="nofollow"><img src="https://img.shields.io/npm/v/gmcp.svg" alt="npm"></a>
<a href="https://hub.docker.com/r/johnie/gmcp" rel="nofollow"><img src="https://img.shields.io/docker/pulls/johnie/gmcp" alt="Docker Pulls"></a>
<a href="https://opensource.org/licenses/MIT" rel="nofollow"><img src="https://img.shields.io/github/license/johnie/gmcp" alt="License"></a>
<a href="https://github.com/johnie/gmcp" rel="nofollow"><img src="https://img.shields.io/github/stars/johnie/gmcp" alt="stars"></a>
</p>

<br/>
<br/>

## Overview

GMCP is a [Model Context Protocol](https://modelcontextprotocol.io/) server that enables LLMs to interact with Gmail and Google Calendar. It provides tools for searching emails, managing labels, sending messages, and working with calendar events—all through secure OAuth2 authentication.

## Installation

### NPM (Recommended)

```bash
# Install globally
npm install -g gmcp

# Or run directly
npx gmcp
bunx gmcp
```

### Docker

```bash
docker pull johnie/gmcp:latest
```

### From Source

```bash
git clone https://github.com/johnie/gmcp.git
cd gmcp
bun install
```

## Quick Start

### 1. Google Cloud Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Gmail API** and **Calendar API**
3. Create **OAuth 2.0 Client ID** (Desktop Application type)
4. Download the credentials JSON file

### 2. Authenticate

```bash
# If installed globally
gmcp-auth

# Or with npx
npx gmcp-auth

# Or from source
bun run auth
```

Follow the prompts to authorize. The browser will show "connection refused" after authorization - this is expected. Copy the `code=` parameter from the URL.

### 3. Run

```bash
# Globally installed
gmcp

# With npx
npx gmcp

# From source
bun run start
```

## Claude Desktop Integration

### Using npx (Recommended)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gmcp": {
      "command": "npx",
      "args": ["-y", "gmcp"],
      "env": {
        "GOOGLE_CREDENTIALS_PATH": "/path/to/credentials.json",
        "GOOGLE_TOKEN_PATH": "/path/to/token.json",
        "GOOGLE_SCOPES": "gmail.readonly,gmail.send,calendar.events"
      }
    }
  }
}
```

### Using Docker

```json
{
  "mcpServers": {
    "gmcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/path/to/credentials.json:/app/data/credentials.json:ro",
        "-v", "/path/to/token.json:/app/data/token.json",
        "-e", "GOOGLE_CREDENTIALS_PATH=/app/data/credentials.json",
        "-e", "GOOGLE_TOKEN_PATH=/app/data/token.json",
        "-e", "GOOGLE_SCOPES=gmail.readonly,gmail.send,calendar.events",
        "johnie/gmcp:latest"
      ]
    }
  }
}
```

### Using Bun (From Source)

```json
{
  "mcpServers": {
    "gmcp": {
      "command": "bun",
      "args": ["run", "/path/to/gmcp/src/index.ts"],
      "env": {
        "GOOGLE_CREDENTIALS_PATH": "/path/to/credentials.json",
        "GOOGLE_TOKEN_PATH": "/path/to/token.json",
        "GOOGLE_SCOPES": "gmail.readonly,gmail.send,calendar.events"
      }
    }
  }
}
```

## Tools

### Gmail (15 tools)

| Tool | Description |
|------|-------------|
| `gmcp_gmail_search_emails` | Search with Gmail query syntax |
| `gmcp_gmail_get_email` | Get message by ID |
| `gmcp_gmail_get_thread` | Get conversation thread |
| `gmcp_gmail_list_attachments` | List attachments on message |
| `gmcp_gmail_get_attachment` | Download attachment data |
| `gmcp_gmail_send_email` | Send new email |
| `gmcp_gmail_reply` | Reply to email in thread |
| `gmcp_gmail_create_draft` | Create draft message |
| `gmcp_gmail_list_labels` | List all labels |
| `gmcp_gmail_get_label` | Get label details |
| `gmcp_gmail_create_label` | Create custom label |
| `gmcp_gmail_update_label` | Update label settings |
| `gmcp_gmail_delete_label` | Delete custom label |
| `gmcp_gmail_modify_labels` | Add/remove labels on message |
| `gmcp_gmail_batch_modify` | Batch label operations |

### Calendar (4 tools)

| Tool | Description |
|------|-------------|
| `gmcp_calendar_list_calendars` | List all calendars |
| `gmcp_calendar_list_events` | List events with filters |
| `gmcp_calendar_get_event` | Get event by ID |
| `gmcp_calendar_create_event` | Create event (supports recurring, Google Meet) |

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CREDENTIALS_PATH` | Path to OAuth2 credentials JSON |
| `GOOGLE_TOKEN_PATH` | Path to store OAuth2 tokens |
| `GOOGLE_SCOPES` | Comma-separated API scopes |

### Scopes

| Scope | Access |
|-------|--------|
| `gmail.readonly` | Read emails and labels |
| `gmail.send` | Send emails |
| `gmail.modify` | Read, modify labels |
| `gmail.labels` | Manage labels |
| `gmail.compose` | Create drafts and send |
| `calendar.readonly` | Read calendars and events |
| `calendar.events` | Manage events |
| `calendar` | Full calendar access |

**Examples:**

```bash
# Read-only
GOOGLE_SCOPES=gmail.readonly,calendar.readonly

# Full access
GOOGLE_SCOPES=gmail.readonly,gmail.modify,gmail.send,calendar.events
```

## Testing

```bash
bunx @modelcontextprotocol/inspector bun run start
```

## License

MIT

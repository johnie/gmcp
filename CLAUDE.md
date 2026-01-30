# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GMCP is an MCP (Model Context Protocol) server that provides Gmail and Google Calendar API integration with OAuth2 authentication. It enables LLMs to search, read, and interact with Gmail messages and Calendar events through a set of tools exposed via the MCP protocol.

## Commands

- **Run server**: `bun run start` (starts MCP server via stdio)
- **Authenticate**: `bun run auth` (OAuth2 flow for Gmail and Calendar APIs)
- **Install dependencies**: `bun install`
- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Test with MCP Inspector**: `bunx @modelcontextprotocol/inspector bun run start`

## Development

- Use Bun instead of Node.js: `bun <file>` instead of `node <file>`
- Bun automatically loads `.env` files (no need for dotenv package)
- Strict TypeScript enabled with additional safety checks
- Code quality enforced via Ultracite (Biome-based linting/formatting)

## Code Style

### TypeScript Types

- Use `interface` for object types; use `type` only for unions, intersections, and aliases
- Infer types from Zod schemas: `type Foo = z.infer<typeof FooSchema>`
- Explicit return types on exported functions
- Use `import type` for type-only imports
- `as const` for immutable config objects
- Union types over enums: `"a" | "b"` not `enum`

### Functional Architecture

- No classes - use factory functions returning object literals
- Pure functions with explicit inputs/outputs
- Composition over inheritance
- Immutable data patterns (spread for updates)

### Function Style

- Named `function` declarations for exports
- Arrow functions only for callbacks/inline ops
- Early returns, minimal nesting
- Single responsibility per function

### Example Patterns

```ts
// Interface for object types
interface EmailMessage {
  id: string
  subject: string
}

// Type alias for unions/intersections
type Status = "pending" | "success" | "error"

// Factory function
function createClient(auth: Auth): Client {
  return {
    async fetch() { ... }
  }
}

// Tool handler
async function searchEmailsTool(client: GmailClient, params: SearchInput) { ... }
```

## Architecture

### Core Components

**Entry Point (`src/index.ts`)**
- Initializes MCP server with stdio transport
- Loads OAuth2 credentials and tokens from environment config
- Creates authenticated Gmail and Calendar clients
- Registers Gmail tools (15 total) and Calendar tools (4 total) with their schemas and handlers

**Authentication (`src/auth.ts`)**
- OAuth2 desktop client flow implementation
- Credential/token file management via Bun.file()
- Automatic token refresh with persistence
- Environment-based configuration (GOOGLE_CREDENTIALS_PATH, GOOGLE_TOKEN_PATH, GOOGLE_SCOPES)

**Gmail Client (`src/gmail.ts`)**
- Wrapper around googleapis Gmail v1 API
- Message parsing and body extraction (text/plain or text/html)
- Base64url encoding/decoding for Gmail API payloads
- MIME message creation for sending/replying

**Calendar Client (`src/calendar.ts`)**
- Wrapper around googleapis Calendar v3 API
- Event parsing and formatting (timed and all-day events)
- RFC3339 timestamp handling
- Auto-detection of all-day vs timed events
- Google Meet conference link creation support

**Tool Layer (`src/tools/*.ts`)**
Each tool exports:
- Zod input schema for MCP validation
- Description string for MCP tool documentation
- Tool handler function that accepts (GmailClient, input) and returns MCP response

Available Gmail tools:
- `gmcp_gmail_search_emails` - Search with Gmail query syntax
- `gmcp_gmail_get_email` - Get single message by ID
- `gmcp_gmail_get_thread` - Get thread (conversation) by ID
- `gmcp_gmail_list_attachments` - List attachments for message
- `gmcp_gmail_get_attachment` - Download attachment data
- `gmcp_gmail_modify_labels` - Add/remove labels on message
- `gmcp_gmail_batch_modify` - Batch label operations
- `gmcp_gmail_send_email` - Send new email
- `gmcp_gmail_reply` - Reply to existing email (maintains thread)
- `gmcp_gmail_create_draft` - Create draft message
- `gmcp_gmail_list_labels` - List all labels
- `gmcp_gmail_get_label` - Get single label by ID
- `gmcp_gmail_create_label` - Create new label
- `gmcp_gmail_update_label` - Update existing label
- `gmcp_gmail_delete_label` - Delete label

Available Calendar tools:
- `gmcp_calendar_list_calendars` - List all calendars for account
- `gmcp_calendar_list_events` - List events with filters (time range, query, calendar)
- `gmcp_calendar_get_event` - Get single event by ID
- `gmcp_calendar_create_event` - Create new event (supports recurring events, Google Meet)

### Gmail Scopes

Tools require appropriate Gmail API scopes configured via `GOOGLE_SCOPES` environment variable:
- Read-only tools: `gmail.readonly`
- Label modification: `gmail.modify` or `gmail.labels`
- Sending emails: `gmail.send` or `gmail.compose`

### Calendar Scopes

Calendar tools require appropriate Calendar API scopes:
- Read-only tools: `calendar.readonly` or `calendar.events.readonly`
- List calendars: `calendar.calendarlist.readonly`
- Manage calendar subscriptions: `calendar.calendarlist`
- Create/modify events: `calendar.events` or `calendar` (full access)

Short scope names (e.g., `gmail.readonly`, `calendar.readonly`) are mapped to full URLs in `src/types.ts`.

### Message Formatting

Tools return markdown-formatted output via `src/utils/markdown.ts` using json2md. This provides structured, readable responses in MCP tool results.

## Adding New Tools

1. Create new tool file in `src/tools/` following existing pattern
2. Define Zod input schema and export it
3. Write tool description string explaining functionality
4. Implement tool handler: `async (client: GmailClient | CalendarClient, input: SchemaType) => MCPResponse`
5. Register tool in `src/index.ts` with schema, description, and handler
6. Set appropriate MCP annotations (readOnlyHint, destructiveHint, idempotentHint)

The tool-registry (`src/tool-registry.ts`) is generic and supports both GmailClient and CalendarClient through type parameters.

## Environment Configuration

Required environment variables (note: renamed from `GMAIL_*` to `GOOGLE_*`):
- `GOOGLE_CREDENTIALS_PATH` - Path to OAuth2 credentials JSON from Google Cloud Console
- `GOOGLE_TOKEN_PATH` - Path to store/load OAuth2 tokens
- `GOOGLE_SCOPES` - Comma-separated scopes for both Gmail and Calendar (short names or full URLs)

Example scopes:
- Gmail only: `gmail.readonly`
- Calendar only: `calendar.readonly`
- Both: `gmail.readonly,calendar.events`

Users must re-authenticate (`bun run auth`) when adding new scopes to existing tokens.

## Security Notes

- Never commit credentials.json or token.json files
- Use minimal required scopes for intended functionality
- Tokens are auto-refreshed and persisted to GOOGLE_TOKEN_PATH

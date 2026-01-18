# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GMCP is an MCP (Model Context Protocol) server that provides Gmail API integration with OAuth2 authentication. It enables LLMs to search, read, and interact with Gmail messages through a set of tools exposed via the MCP protocol.

## Commands

- **Run server**: `bun run start` (starts MCP server via stdio)
- **Authenticate**: `bun run auth` (OAuth2 flow for Gmail API)
- **Install dependencies**: `bun install`
- **Format code**: `bun x ultracite fix`
- **Check for issues**: `bun x ultracite check`
- **Test with MCP Inspector**: `bunx @modelcontextprotocol/inspector bun run start`

## Development

- Use Bun instead of Node.js: `bun <file>` instead of `node <file>`
- Bun automatically loads `.env` files (no need for dotenv package)
- Strict TypeScript enabled with additional safety checks
- Code quality enforced via Ultracite (Biome-based linting/formatting)

## Architecture

### Core Components

**Entry Point (`src/index.ts`)**
- Initializes MCP server with stdio transport
- Loads OAuth2 credentials and tokens from environment config
- Creates authenticated Gmail client
- Registers 10 Gmail tools with their schemas and handlers

**Authentication (`src/auth.ts`)**
- OAuth2 desktop client flow implementation
- Credential/token file management via Bun.file()
- Automatic token refresh with persistence
- Environment-based configuration (GMAIL_CREDENTIALS_PATH, GMAIL_TOKEN_PATH, GMAIL_SCOPES)

**Gmail Client (`src/gmail.ts`)**
- Wrapper around googleapis Gmail v1 API
- Message parsing and body extraction (text/plain or text/html)
- Base64url encoding/decoding for Gmail API payloads
- MIME message creation for sending/replying

**Tool Layer (`src/tools/*.ts`)**
Each tool exports:
- Zod input schema for MCP validation
- Description string for MCP tool documentation
- Tool handler function that accepts (GmailClient, input) and returns MCP response

Available tools:
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

### Gmail Scopes

Tools require appropriate Gmail API scopes configured via `GMAIL_SCOPES` environment variable:
- Read-only tools: `gmail.readonly`
- Label modification: `gmail.modify` or `gmail.labels`
- Sending emails: `gmail.send` or `gmail.compose`

Short scope names (e.g., `gmail.readonly`) are mapped to full URLs in `src/types.ts`.

### Message Formatting

Tools return markdown-formatted output via `src/utils/markdown.ts` using json2md. This provides structured, readable responses in MCP tool results.

## Adding New Tools

1. Create new tool file in `src/tools/` following existing pattern
2. Define Zod input schema and export it
3. Write tool description string explaining functionality
4. Implement tool handler: `async (client: GmailClient, input: SchemaType) => MCPResponse`
5. Register tool in `src/index.ts` with schema, description, and handler
6. Set appropriate MCP annotations (readOnlyHint, destructiveHint, idempotentHint)

## Environment Configuration

Required environment variables:
- `GMAIL_CREDENTIALS_PATH` - Path to OAuth2 credentials JSON from Google Cloud Console
- `GMAIL_TOKEN_PATH` - Path to store/load OAuth2 tokens
- `GMAIL_SCOPES` - Comma-separated Gmail scopes (short names or full URLs)

## Security Notes

- Never commit credentials.json or token.json files
- Use minimal required scopes for intended functionality
- Tokens are auto-refreshed and persisted to GMAIL_TOKEN_PATH

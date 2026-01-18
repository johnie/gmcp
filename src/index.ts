#!/usr/bin/env bun
/**
 * GMCP Server
 *
 * MCP server for Gmail API with OAuth2 authentication.
 * Provides tools to search and interact with Gmail messages.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAuthenticatedClient, getEnvConfig } from "./auth.ts";
import { GmailClient } from "./gmail.ts";
import {
  SEARCH_EMAILS_DESCRIPTION,
  type SearchEmailsInput,
  SearchEmailsInputSchema,
  searchEmailsTool,
} from "./tools/search.ts";

/**
 * Main server initialization
 */
async function main() {
  console.error("GMCP Server - Starting...");

  // Get configuration from environment
  const { credentialsPath, tokenPath, scopes } = getEnvConfig();

  console.error(`Credentials: ${credentialsPath}`);
  console.error(`Token: ${tokenPath}`);
  console.error(`Scopes: ${scopes.join(", ")}`);

  // Create authenticated OAuth2 client
  console.error("Authenticating with Gmail API...");
  const oauth2Client = await createAuthenticatedClient(
    credentialsPath,
    tokenPath
  );

  // Create Gmail client
  const gmailClient = new GmailClient(oauth2Client);

  console.error("Gmail client initialized");

  // Create MCP server
  const server = new McpServer({
    name: "gmail-mcp-server",
    version: "1.0.0",
  });

  // Register gmail_search_emails tool
  server.registerTool(
    "gmcp_gmail_search_emails",
    {
      title: "Search Gmail Emails",
      description: SEARCH_EMAILS_DESCRIPTION,
      inputSchema: SearchEmailsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params: SearchEmailsInput) => {
      return await searchEmailsTool(gmailClient, params);
    }
  );

  console.error("Tools registered");

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("MCP server connected via stdio");
  console.error("Ready to accept requests");
}

// Run the server
main().catch((error) => {
  console.error("Fatal error:");
  console.error(error);
  process.exit(1);
});

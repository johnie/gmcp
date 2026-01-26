/**
 * Tool registration utilities for MCP server
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import type { ToolResponse } from "@/utils/tool-helpers.ts";

/**
 * Tool definition structure
 */
export interface ToolDefinition<TInput> {
  name: string;
  title: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
  handler: (client: GmailClient, params: TInput) => Promise<ToolResponse>;
}

/**
 * Annotation constants for read-only tools
 */
export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

/**
 * Annotation constants for modify tools
 */
export const MODIFY_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/**
 * Annotation constants for send tools
 */
export const SEND_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

/**
 * Annotation constants for destructive tools
 */
export const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

/**
 * Register multiple tools with the MCP server
 */
export function registerTools(
  server: McpServer,
  gmailClient: GmailClient,
  tools: ToolDefinition<unknown>[]
): void {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
      },
      async (params: unknown) => {
        return await tool.handler(gmailClient, params);
      }
    );
  }
}

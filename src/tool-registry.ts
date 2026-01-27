/**
 * Tool registration utilities for MCP server
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "pino";
import type { z } from "zod";
import type { ToolResponse } from "@/utils/tool-helpers.ts";

/**
 * Tool definition structure
 * Generic to support different client types (GmailClient, CalendarClient, etc.)
 */
export interface ToolDefinition<TInput = unknown, TClient = unknown> {
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
  handler: (client: TClient, params: TInput) => Promise<ToolResponse>;
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
 * Generic to support different client types (GmailClient, CalendarClient, etc.)
 */
export function registerTools<TClient>(
  server: McpServer,
  client: TClient,
  tools: ToolDefinition<unknown, TClient>[],
  logger?: Logger
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
        const toolLogger = logger?.child({ tool: tool.name });
        const startTime = Date.now();

        toolLogger?.info({ params }, "Tool execution start");

        try {
          const result = await tool.handler(client, params);

          toolLogger?.info(
            { durationMs: Date.now() - startTime, success: !result.isError },
            "Tool execution completed"
          );

          return result;
        } catch (error) {
          toolLogger?.error(
            {
              durationMs: Date.now() - startTime,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
            "Tool execution failed"
          );
          throw error;
        }
      }
    );
  }
}

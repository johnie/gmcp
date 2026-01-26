/**
 * Shared utilities for MCP tool implementations
 */

/**
 * MCP tool response type
 */
export interface ToolResponse {
  [x: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: { [x: string]: unknown };
  isError?: boolean;
}

/**
 * Format email for structured output with snake_case fields
 */
export function formatEmailForOutput(email: {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
  labels?: string[];
}) {
  return {
    id: email.id,
    thread_id: email.threadId,
    subject: email.subject,
    from: email.from,
    to: email.to,
    date: email.date,
    snippet: email.snippet,
    ...(email.body ? { body: email.body } : {}),
    ...(email.labels ? { labels: email.labels } : {}),
  };
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  context: string,
  error: unknown
): ToolResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: "text",
        text: `Error ${context}: ${errorMessage}`,
      },
    ],
    isError: true,
  };
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(
  textContent: string,
  structuredContent?: { [x: string]: unknown }
): ToolResponse {
  return {
    content: [{ type: "text", text: textContent }],
    ...(structuredContent ? { structuredContent } : {}),
  };
}

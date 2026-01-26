/**
 * Gmail get thread tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import {
  createErrorResponse,
  formatEmailForOutput,
} from "@/utils/tool-helpers.ts";

/**
 * Input schema for gmail_get_thread tool
 */
export const GetThreadInputSchema = z.object({
  thread_id: z
    .string()
    .min(1, "Thread ID cannot be empty")
    .describe("The Gmail thread ID to retrieve"),
  include_body: z
    .boolean()
    .default(false)
    .describe(
      "Whether to include full email body for all messages (default: false)"
    ),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type GetThreadInput = z.infer<typeof GetThreadInputSchema>;

/**
 * Convert thread to markdown format
 */
function threadToMarkdown(
  threadId: string,
  messages: Array<{
    id: string;
    thread_id: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    snippet: string;
    body?: string;
    labels?: string[];
  }>
): string {
  const sections: json2md.DataObject[] = [
    { h1: `Thread: ${messages[0]?.subject || "Conversation"}` },
    {
      p: `**Thread ID:** ${threadId} | **Messages:** ${messages.length}`,
    },
  ];

  for (const [index, message] of messages.entries()) {
    sections.push({ h2: `Message ${index + 1}` });
    sections.push({
      ul: [
        `**From:** ${message.from}`,
        `**To:** ${message.to}`,
        `**Date:** ${message.date}`,
        `**Message ID:** ${message.id}`,
      ],
    });

    if (message.labels && message.labels.length > 0) {
      sections.push({
        p: `**Labels:** ${message.labels.join(", ")}`,
      });
    }

    if (message.body) {
      sections.push({ h3: "Body" });
      sections.push({ p: message.body });
    } else {
      sections.push({ h3: "Snippet" });
      sections.push({ p: message.snippet });
    }

    if (index < messages.length - 1) {
      sections.push({ p: "---" });
    }
  }

  return json2md(sections);
}

/**
 * Gmail get thread tool implementation
 */
export async function getThreadTool(
  gmailClient: GmailClient,
  params: GetThreadInput
) {
  try {
    const messages = await gmailClient.getThread(
      params.thread_id,
      params.include_body
    );

    const output = {
      thread_id: params.thread_id,
      message_count: messages.length,
      messages: messages.map(formatEmailForOutput),
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : threadToMarkdown(params.thread_id, output.messages);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("getting thread", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const GET_THREAD_DESCRIPTION = `Get an entire Gmail conversation thread by its thread ID.

This tool retrieves all messages in a Gmail conversation thread (email chain). Threads group related messages together, including original emails and all replies.

**Parameters**:
- \`thread_id\` (string, required): The Gmail thread ID to retrieve
- \`include_body\` (boolean, optional): Include full email body for all messages (default: false, only snippets)
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`thread_id\`: The thread ID
- \`message_count\`: Number of messages in the thread
- \`messages\`: Array of email messages in chronological order, each containing:
  - \`id\`: Message ID
  - \`thread_id\`: Thread ID
  - \`subject\`: Email subject
  - \`from\`: Sender email address
  - \`to\`: Recipient email address(es)
  - \`date\`: Email date
  - \`snippet\`: Short preview
  - \`body\`: Full body (if include_body is true)
  - \`labels\`: Gmail labels

**Examples**:
- Get thread with snippets: \`{ "thread_id": "18f3c5d4e8a2b1c0" }\`
- Get thread with full bodies: \`{ "thread_id": "18f3c5d4e8a2b1c0", "include_body": true }\`
- JSON output: \`{ "thread_id": "18f3c5d4e8a2b1c0", "output_format": "json" }\`

**Error Handling**:
- Returns error if thread ID doesn't exist
- Returns error if authentication fails
- Returns error if Gmail API request fails

**Use Cases**:
- View complete email conversation history
- Analyze email chains and reply patterns
- Extract all messages from a discussion thread`;

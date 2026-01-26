/**
 * Gmail get email tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import {
  createErrorResponse,
  formatEmailForOutput,
} from "@/utils/tool-helpers.ts";

/**
 * Input schema for gmail_get_email tool
 */
export const GetEmailInputSchema = z.object({
  message_id: z
    .string()
    .min(1, "Message ID cannot be empty")
    .describe("The Gmail message ID to retrieve"),
  include_body: z
    .boolean()
    .default(true)
    .describe("Whether to include full email body in results (default: true)"),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type GetEmailInput = z.infer<typeof GetEmailInputSchema>;

/**
 * Convert email to markdown format
 */
function emailToMarkdown(email: {
  id: string;
  thread_id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
  labels?: string[];
}): string {
  const sections: json2md.DataObject[] = [
    { h1: email.subject },
    {
      ul: [
        `**From:** ${email.from}`,
        `**To:** ${email.to}`,
        `**Date:** ${email.date}`,
        `**Message ID:** ${email.id}`,
        `**Thread ID:** ${email.thread_id}`,
      ],
    },
  ];

  if (email.labels && email.labels.length > 0) {
    sections.push({
      p: `**Labels:** ${email.labels.join(", ")}`,
    });
  }

  if (email.body) {
    sections.push({ h2: "Body" });
    sections.push({ p: email.body });
  } else {
    sections.push({ h2: "Snippet" });
    sections.push({ p: email.snippet });
  }

  return json2md(sections);
}

/**
 * Gmail get email tool implementation
 */
export async function getEmailTool(
  gmailClient: GmailClient,
  params: GetEmailInput
) {
  try {
    const email = await gmailClient.getMessage(
      params.message_id,
      params.include_body
    );

    const output = formatEmailForOutput(email);

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : emailToMarkdown(output);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("getting email", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const GET_EMAIL_DESCRIPTION = `Get a single Gmail email by its message ID with full details.

This tool retrieves a specific email message from Gmail using its unique message ID. It returns detailed information including headers, body content, labels, and thread information.

**Parameters**:
- \`message_id\` (string, required): The Gmail message ID to retrieve
- \`include_body\` (boolean, optional): Include full email body (default: true)
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`id\`: Message ID
- \`thread_id\`: Thread ID (for conversation grouping)
- \`subject\`: Email subject line
- \`from\`: Sender email address
- \`to\`: Recipient email address(es)
- \`date\`: Email date
- \`snippet\`: Short preview of email content
- \`body\`: Full email body (if include_body is true)
- \`labels\`: Array of Gmail labels applied to the email

**Examples**:
- Get email with body: \`{ "message_id": "18f3c5d4e8a2b1c0" }\`
- Get email metadata only: \`{ "message_id": "18f3c5d4e8a2b1c0", "include_body": false }\`
- JSON output: \`{ "message_id": "18f3c5d4e8a2b1c0", "output_format": "json" }\`

**Error Handling**:
- Returns error if message ID doesn't exist
- Returns error if authentication fails
- Returns error if Gmail API request fails

**Use Cases**:
- View full content of a specific email
- Get detailed email headers and metadata
- Retrieve email for further processing or analysis`;

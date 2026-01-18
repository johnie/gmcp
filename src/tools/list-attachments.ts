/**
 * Gmail list attachments tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";

/**
 * Input schema for gmail_list_attachments tool
 */
export const ListAttachmentsInputSchema = z.object({
  message_id: z
    .string()
    .min(1, "Message ID cannot be empty")
    .describe("The Gmail message ID to list attachments from"),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type ListAttachmentsInput = z.infer<typeof ListAttachmentsInputSchema>;

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Convert attachments to markdown format
 */
function attachmentsToMarkdown(
  messageId: string,
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>
): string {
  const sections: json2md.DataObject[] = [
    { h1: "Email Attachments" },
    {
      p: `**Message ID:** ${messageId} | **Total Attachments:** ${attachments.length}`,
    },
  ];

  if (attachments.length === 0) {
    sections.push({ p: "*No attachments found in this email.*" });
  } else {
    for (const [index, attachment] of attachments.entries()) {
      sections.push({ h2: `${index + 1}. ${attachment.filename}` });
      sections.push({
        ul: [
          `**Type:** ${attachment.mimeType}`,
          `**Size:** ${formatBytes(attachment.size)}`,
          `**Attachment ID:** ${attachment.attachmentId}`,
        ],
      });
    }
  }

  return json2md(sections);
}

/**
 * Gmail list attachments tool implementation
 */
export async function listAttachmentsTool(
  gmailClient: GmailClient,
  params: ListAttachmentsInput
) {
  try {
    const attachments = await gmailClient.listAttachments(params.message_id);

    const output = {
      message_id: params.message_id,
      attachment_count: attachments.length,
      attachments: attachments.map((att) => ({
        filename: att.filename,
        mime_type: att.mimeType,
        size: att.size,
        size_formatted: formatBytes(att.size),
        attachment_id: att.attachmentId,
      })),
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : attachmentsToMarkdown(params.message_id, attachments);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text" as const,
          text: `Error listing attachments: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Tool description for MCP server registration
 */
export const LIST_ATTACHMENTS_DESCRIPTION = `List all attachments for a Gmail email message.

This tool retrieves metadata about all attachments in a specific email message, including filenames, MIME types, sizes, and attachment IDs needed to download them.

**Parameters**:
- \`message_id\` (string, required): The Gmail message ID to list attachments from
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`message_id\`: The message ID
- \`attachment_count\`: Number of attachments found
- \`attachments\`: Array of attachment metadata objects:
  - \`filename\`: Original filename
  - \`mime_type\`: MIME type (e.g., "application/pdf", "image/jpeg")
  - \`size\`: Size in bytes
  - \`size_formatted\`: Human-readable size (e.g., "2.5 MB")
  - \`attachment_id\`: ID needed to download the attachment

**Examples**:
- List attachments: \`{ "message_id": "18f3c5d4e8a2b1c0" }\`
- JSON output: \`{ "message_id": "18f3c5d4e8a2b1c0", "output_format": "json" }\`

**Error Handling**:
- Returns error if message ID doesn't exist
- Returns error if authentication fails
- Returns empty array if message has no attachments

**Use Cases**:
- Check if an email has attachments before downloading
- Get attachment metadata for processing decisions
- List attachment IDs for use with get_attachment tool`;

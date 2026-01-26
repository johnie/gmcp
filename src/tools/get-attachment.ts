/**
 * Gmail get attachment tool for MCP Server
 */

import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import { createErrorResponse } from "@/utils/tool-helpers.ts";

/**
 * Input schema for gmail_get_attachment tool
 */
export const GetAttachmentInputSchema = z.object({
  message_id: z
    .string()
    .min(1, "Message ID cannot be empty")
    .describe("The Gmail message ID containing the attachment"),
  attachment_id: z
    .string()
    .min(1, "Attachment ID cannot be empty")
    .describe("The attachment ID to download (from list_attachments)"),
  output_format: z
    .enum(["base64", "json"])
    .default("base64")
    .describe(
      "Output format: base64 (default, returns raw base64url string) or json (returns structured object)"
    ),
});

export type GetAttachmentInput = z.infer<typeof GetAttachmentInputSchema>;

/**
 * Gmail get attachment tool implementation
 */
export async function getAttachmentTool(
  gmailClient: GmailClient,
  params: GetAttachmentInput
) {
  try {
    const attachmentData = await gmailClient.getAttachment(
      params.message_id,
      params.attachment_id
    );

    const output = {
      message_id: params.message_id,
      attachment_id: params.attachment_id,
      data: attachmentData,
      encoding: "base64url",
      note: "Data is base64url encoded. To decode: replace - with +, _ with /, then base64 decode.",
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : attachmentData;

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("getting attachment", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const GET_ATTACHMENT_DESCRIPTION = `Download a Gmail attachment by its attachment ID.

This tool downloads the content of a specific attachment from a Gmail message. The attachment is returned as base64url-encoded data.

**Parameters**:
- \`message_id\` (string, required): The Gmail message ID containing the attachment
- \`attachment_id\` (string, required): The attachment ID (obtained from list_attachments tool)
- \`output_format\` (string, optional): Output format: "base64" (default) or "json"

**Returns**:
- \`message_id\`: The message ID
- \`attachment_id\`: The attachment ID
- \`data\`: Base64url-encoded attachment data
- \`encoding\`: Always "base64url"
- \`note\`: Decoding instructions

**Base64url Encoding**:
Gmail uses base64url encoding (URL-safe variant):
- Characters \`-\` and \`_\` replace \`+\` and \`/\`
- No padding with \`=\`

To decode:
1. Replace \`-\` with \`+\`
2. Replace \`_\` with \`/\`
3. Base64 decode the result

**Examples**:
- Get attachment: \`{ "message_id": "18f3c5d4e8a2b1c0", "attachment_id": "ANGjdJ8..." }\`
- JSON output: \`{ "message_id": "18f3c5d4e8a2b1c0", "attachment_id": "ANGjdJ8...", "output_format": "json" }\`

**Error Handling**:
- Returns error if message ID doesn't exist
- Returns error if attachment ID doesn't exist or is invalid
- Returns error if authentication fails

**Use Cases**:
- Download email attachments programmatically
- Extract attachment data for processing
- Save attachments to disk after decoding

**Workflow**:
1. Use \`list_attachments\` to get attachment IDs and metadata
2. Use this tool to download specific attachments by ID
3. Decode base64url data to get original file content`;

/**
 * Gmail delete email tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import { OutputFormatSchema } from "@/schemas/shared.ts";
import { createErrorResponse } from "@/utils/tool-helpers.ts";

/**
 * Input schema for gmcp_gmail_delete_email tool
 */
export const DeleteEmailInputSchema = z.object({
  message_id: z
    .string()
    .min(1, "Message ID cannot be empty")
    .describe("The Gmail message ID to permanently delete"),
  output_format: OutputFormatSchema,
});

export type DeleteEmailInput = z.infer<typeof DeleteEmailInputSchema>;

/**
 * Convert deletion result to markdown
 */
function deletionToMarkdown(messageId: string): string {
  const sections: json2md.DataObject[] = [
    { h1: "Email Deleted Successfully" },
    {
      p: `Message with ID **${messageId}** has been permanently deleted from your Gmail account.`,
    },
    { h2: "Important Notes" },
    {
      ul: [
        "The email has been permanently deleted (not moved to trash)",
        "This action cannot be undone",
        "The email cannot be recovered",
      ],
    },
  ];

  return json2md(sections);
}

/**
 * Gmail delete email tool implementation
 */
export async function deleteEmailTool(
  gmailClient: GmailClient,
  params: DeleteEmailInput
) {
  try {
    await gmailClient.deleteEmail(params.message_id);

    const output = {
      message_id: params.message_id,
      deleted: true,
      message: "Email permanently deleted. This action cannot be undone.",
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : deletionToMarkdown(params.message_id);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("deleting email", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const DELETE_EMAIL_DESCRIPTION = `Permanently delete a Gmail email message.

**WARNING: This is a destructive operation that CANNOT be undone. The email is permanently deleted and bypasses the trash folder.**

This tool permanently deletes an email message from your Gmail account. Unlike moving to trash, this operation immediately and permanently removes the email.

**Parameters**:
- \`message_id\` (string, required): The Gmail message ID to delete
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`message_id\`: The deleted message ID
- \`deleted\`: Always true on success
- \`message\`: Confirmation message

**Examples**:
- Delete email: \`{ "message_id": "18f3c5d4e8a2b1c0" }\`
- Delete with JSON output: \`{ "message_id": "18f3c5d4e8a2b1c0", "output_format": "json" }\`

**Safety Considerations**:
- This is a destructive operation marked with \`destructiveHint: true\`
- The email is permanently deleted, not moved to trash
- This action cannot be undone - the email cannot be recovered
- Consider using \`modify_labels\` with \`add_labels: ["TRASH"]\` if you want recoverable deletion
- Use \`get_email\` first to verify which email you're deleting

**Use Cases**:
- Permanently remove sensitive emails
- Clean up emails that should not be recoverable
- Remove emails that are already in trash permanently

**Error Handling**:
- Returns error if message ID doesn't exist
- Returns error if authentication lacks sufficient permissions

**Scope Requirements**:
- Requires \`gmail.modify\` or full \`mail.google.com\` scope`;

/**
 * Gmail archive email tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import {
  createErrorResponse,
  formatEmailForOutput,
} from "@/utils/tool-helpers.ts";

/**
 * Input schema for gmcp_gmail_archive_email tool
 */
export const ArchiveEmailInputSchema = z.object({
  message_id: z
    .string()
    .min(1, "Message ID cannot be empty")
    .describe("The Gmail message ID to archive"),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type ArchiveEmailInput = z.infer<typeof ArchiveEmailInputSchema>;

/**
 * Convert archive result to markdown
 */
function archiveToMarkdown(email: {
  id: string;
  thread_id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  labels: string[];
}): string {
  const sections: json2md.DataObject[] = [
    { h1: "Email Archived Successfully" },
    { h2: "Message Details" },
    {
      ul: [
        `**Subject:** ${email.subject}`,
        `**From:** ${email.from}`,
        `**Message ID:** ${email.id}`,
      ],
    },
    { h2: "Current Labels" },
    {
      p:
        email.labels.length > 0
          ? email.labels.join(", ")
          : "*No labels on this message*",
    },
    { h2: "Notes" },
    {
      ul: [
        "The email has been removed from your inbox",
        "The email is still accessible in All Mail",
        "To unarchive, add the INBOX label back to the message",
      ],
    },
  ];

  return json2md(sections);
}

/**
 * Gmail archive email tool implementation
 */
export async function archiveEmailTool(
  gmailClient: GmailClient,
  params: ArchiveEmailInput
) {
  try {
    const email = await gmailClient.modifyLabels(params.message_id, undefined, [
      "INBOX",
    ]);

    const formattedEmail = formatEmailForOutput(email);
    const output = {
      message_id: params.message_id,
      subject: email.subject,
      archived: true,
      removed_labels: ["INBOX"],
      current_labels: email.labels || [],
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : archiveToMarkdown({
            ...formattedEmail,
            labels: email.labels || [],
          });

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("archiving email", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const ARCHIVE_EMAIL_DESCRIPTION = `Archive a Gmail email by removing it from the inbox.

This tool archives an email message by removing the INBOX label. The email remains accessible in "All Mail" and can be unarchived by adding the INBOX label back.

**Parameters**:
- \`message_id\` (string, required): The Gmail message ID to archive
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`message_id\`: The archived message ID
- \`subject\`: Email subject
- \`archived\`: Always true on success
- \`removed_labels\`: Labels that were removed (always ["INBOX"])
- \`current_labels\`: All current labels on the message after archiving

**Examples**:
- Archive email: \`{ "message_id": "18f3c5d4e8a2b1c0" }\`
- Archive with JSON output: \`{ "message_id": "18f3c5d4e8a2b1c0", "output_format": "json" }\`

**Important Notes**:
- This is a reversible operation - archived emails can be unarchived
- The email is moved out of the inbox but remains in "All Mail"
- To unarchive, use \`modify_labels\` with \`add_labels: ["INBOX"]\`
- This is different from \`delete_email\` which permanently removes the message

**Use Cases**:
- Clean up inbox without deleting emails
- Archive emails after reading/processing them
- Remove emails from inbox while keeping them for reference

**Error Handling**:
- Returns error if message ID doesn't exist
- Returns error if authentication lacks sufficient permissions

**Scope Requirements**:
- Requires \`gmail.modify\` or full \`mail.google.com\` scope`;

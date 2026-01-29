/**
 * Gmail modify labels tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import { OutputFormatSchema } from "@/schemas/shared.ts";
import {
  createErrorResponse,
  formatEmailForOutput,
} from "@/utils/tool-helpers.ts";

/**
 * Input schema for gmail_modify_labels tool
 */
export const ModifyLabelsInputSchema = z.object({
  message_id: z
    .string()
    .min(1, "Message ID cannot be empty")
    .describe("The Gmail message ID to modify labels for"),
  add_labels: z
    .array(z.string())
    .optional()
    .describe(
      "Label IDs to add (e.g., ['STARRED', 'INBOX', 'UNREAD'] or custom label IDs)"
    ),
  remove_labels: z
    .array(z.string())
    .optional()
    .describe(
      "Label IDs to remove (e.g., ['UNREAD', 'INBOX'] to mark read and archive)"
    ),
  output_format: OutputFormatSchema,
});

export type ModifyLabelsInput = z.infer<typeof ModifyLabelsInputSchema>;

/**
 * Convert label modification result to markdown
 */
function labelModificationToMarkdown(
  email: {
    id: string;
    thread_id: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    snippet: string;
    labels: string[];
  },
  addedLabels?: string[],
  removedLabels?: string[]
): string {
  const sections: json2md.DataObject[] = [
    { h1: "Label Modification Successful" },
    { h2: "Message Details" },
    {
      ul: [
        `**Subject:** ${email.subject}`,
        `**From:** ${email.from}`,
        `**Message ID:** ${email.id}`,
      ],
    },
  ];

  if (addedLabels && addedLabels.length > 0) {
    sections.push({ h2: "Added Labels" });
    sections.push({ ul: addedLabels });
  }

  if (removedLabels && removedLabels.length > 0) {
    sections.push({ h2: "Removed Labels" });
    sections.push({ ul: removedLabels });
  }

  sections.push({ h2: "Current Labels" });
  sections.push({
    p:
      email.labels.length > 0
        ? email.labels.join(", ")
        : "*No labels on this message*",
  });

  return json2md(sections);
}

/**
 * Gmail modify labels tool implementation
 */
export async function modifyLabelsTool(
  gmailClient: GmailClient,
  params: ModifyLabelsInput
) {
  try {
    if (!(params.add_labels || params.remove_labels)) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: Must specify at least one of add_labels or remove_labels",
          },
        ],
        isError: true,
      };
    }

    const email = await gmailClient.modifyLabels(
      params.message_id,
      params.add_labels,
      params.remove_labels
    );

    const output = {
      message_id: params.message_id,
      subject: email.subject,
      modified: true,
      added_labels: params.add_labels || [],
      removed_labels: params.remove_labels || [],
      current_labels: email.labels || [],
    };

    const formattedEmail = formatEmailForOutput(email);
    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : labelModificationToMarkdown(
            {
              ...formattedEmail,
              labels: email.labels || [],
            },
            params.add_labels,
            params.remove_labels
          );

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("modifying labels", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const MODIFY_LABELS_DESCRIPTION = `Modify Gmail labels on a single message (add or remove labels).

This tool allows you to add or remove labels from a Gmail message. Labels are used for organizing emails, marking read/unread status, starring, archiving, and more.

**Common Gmail System Labels**:
- \`INBOX\` - Inbox (remove to archive)
- \`UNREAD\` - Unread status (remove to mark as read)
- \`STARRED\` - Starred/important
- \`SPAM\` - Spam folder
- \`TRASH\` - Trash folder
- \`SENT\` - Sent mail
- \`DRAFT\` - Draft messages
- \`IMPORTANT\` - Important marker
- \`CATEGORY_PERSONAL\`, \`CATEGORY_SOCIAL\`, \`CATEGORY_PROMOTIONS\`, etc.

**Custom Labels**:
- User-created labels have IDs like \`Label_123\`
- Use the list_labels tool to discover custom label IDs

**Parameters**:
- \`message_id\` (string, required): The Gmail message ID to modify
- \`add_labels\` (array, optional): Label IDs to add
- \`remove_labels\` (array, optional): Label IDs to remove
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`message_id\`: The message ID
- \`subject\`: Email subject
- \`modified\`: Always true on success
- \`added_labels\`: Labels that were added
- \`removed_labels\`: Labels that were removed
- \`current_labels\`: All current labels on the message

**Examples**:
- Mark as read and archive: \`{ "message_id": "18f3c5d4e8a2b1c0", "remove_labels": ["UNREAD", "INBOX"] }\`
- Star an email: \`{ "message_id": "18f3c5d4e8a2b1c0", "add_labels": ["STARRED"] }\`
- Mark as unread: \`{ "message_id": "18f3c5d4e8a2b1c0", "add_labels": ["UNREAD"] }\`
- Add to inbox: \`{ "message_id": "18f3c5d4e8a2b1c0", "add_labels": ["INBOX"] }\`
- Apply custom label: \`{ "message_id": "18f3c5d4e8a2b1c0", "add_labels": ["Label_123"] }\`

**Error Handling**:
- Returns error if message ID doesn't exist
- Returns error if label ID is invalid
- Returns error if authentication lacks modify permissions
- Requires at least one of add_labels or remove_labels

**Use Cases**:
- Mark emails as read or unread
- Archive emails (remove INBOX label)
- Star important messages
- Apply custom labels for organization
- Move messages to trash or spam`;

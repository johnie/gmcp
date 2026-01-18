/**
 * Gmail batch modify labels tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";

/**
 * Input schema for gmail_batch_modify tool
 */
export const BatchModifyInputSchema = z.object({
  message_ids: z
    .array(z.string())
    .min(1, "Must provide at least one message ID")
    .max(1000, "Maximum 1000 messages per batch")
    .describe("Array of Gmail message IDs to modify (max 1000)"),
  add_labels: z
    .array(z.string())
    .optional()
    .describe(
      "Label IDs to add to all messages (e.g., ['STARRED', 'IMPORTANT'])"
    ),
  remove_labels: z
    .array(z.string())
    .optional()
    .describe(
      "Label IDs to remove from all messages (e.g., ['UNREAD', 'INBOX'])"
    ),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type BatchModifyInput = z.infer<typeof BatchModifyInputSchema>;

/**
 * Convert batch modification result to markdown
 */
function batchModificationToMarkdown(
  messageCount: number,
  addedLabels?: string[],
  removedLabels?: string[]
): string {
  const sections: json2md.DataObject[] = [
    { h1: "Batch Label Modification Successful" },
    { p: `**Modified Messages:** ${messageCount}` },
  ];

  if (addedLabels && addedLabels.length > 0) {
    sections.push({ h2: "Added Labels" });
    sections.push({ ul: addedLabels });
  }

  if (removedLabels && removedLabels.length > 0) {
    sections.push({ h2: "Removed Labels" });
    sections.push({ ul: removedLabels });
  }

  sections.push({
    p: `All ${messageCount} messages have been updated successfully.`,
  });

  return json2md(sections);
}

/**
 * Gmail batch modify labels tool implementation
 */
export async function batchModifyTool(
  gmailClient: GmailClient,
  params: BatchModifyInput
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

    await gmailClient.batchModifyLabels(
      params.message_ids,
      params.add_labels,
      params.remove_labels
    );

    const output = {
      modified_count: params.message_ids.length,
      message_ids: params.message_ids,
      added_labels: params.add_labels || [],
      removed_labels: params.remove_labels || [],
      success: true,
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : batchModificationToMarkdown(
            params.message_ids.length,
            params.add_labels,
            params.remove_labels
          );

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
          text: `Error batch modifying labels: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Tool description for MCP server registration
 */
export const BATCH_MODIFY_DESCRIPTION = `Batch modify Gmail labels on multiple messages at once.

This tool allows you to efficiently add or remove labels from multiple Gmail messages in a single operation. It's ideal for bulk email management tasks.

**Common Use Cases**:
- Archive multiple emails at once
- Mark multiple emails as read
- Star a group of important emails
- Apply custom labels to multiple messages
- Clean up inbox by bulk archiving

**System Labels**:
- \`INBOX\` - Inbox (remove to archive)
- \`UNREAD\` - Unread status (remove to mark as read)
- \`STARRED\` - Starred/important
- \`SPAM\` - Spam folder
- \`TRASH\` - Trash folder
- \`IMPORTANT\` - Important marker

**Parameters**:
- \`message_ids\` (array, required): Array of message IDs to modify (max 1000)
- \`add_labels\` (array, optional): Label IDs to add to all messages
- \`remove_labels\` (array, optional): Label IDs to remove from all messages
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`modified_count\`: Number of messages modified
- \`message_ids\`: Array of message IDs that were modified
- \`added_labels\`: Labels that were added
- \`removed_labels\`: Labels that were removed
- \`success\`: Always true on success

**Examples**:
- Archive multiple emails: \`{ "message_ids": ["id1", "id2", "id3"], "remove_labels": ["INBOX"] }\`
- Bulk mark as read: \`{ "message_ids": ["id1", "id2"], "remove_labels": ["UNREAD"] }\`
- Star multiple emails: \`{ "message_ids": ["id1", "id2"], "add_labels": ["STARRED"] }\`
- Archive and mark read: \`{ "message_ids": ["id1", "id2"], "remove_labels": ["INBOX", "UNREAD"] }\`

**Limits**:
- Maximum 1000 messages per batch operation
- For larger operations, split into multiple batches

**Error Handling**:
- Returns error if any message ID is invalid
- Returns error if label ID is invalid
- Returns error if authentication lacks modify permissions
- Requires at least one of add_labels or remove_labels
- Operation is atomic: all messages are modified or none are

**Workflow**:
1. Use \`search_emails\` to find messages matching criteria
2. Extract message IDs from search results
3. Use this tool to batch modify labels on all found messages

**Performance**:
- Much faster than modifying messages individually
- Single API call regardless of message count
- Recommended for operations affecting more than 5 messages`;

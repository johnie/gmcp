/**
 * Gmail delete label tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";

/**
 * System labels that cannot be deleted
 */
const SYSTEM_LABELS = [
  "INBOX",
  "SENT",
  "DRAFT",
  "TRASH",
  "SPAM",
  "STARRED",
  "IMPORTANT",
  "UNREAD",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
];

/**
 * Input schema for gmcp_gmail_delete_label tool
 */
export const DeleteLabelInputSchema = z.object({
  label_id: z
    .string()
    .min(1, "Label ID cannot be empty")
    .describe(
      "The label ID to delete (e.g., 'Label_123'). Cannot delete system labels."
    ),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type DeleteLabelInput = z.infer<typeof DeleteLabelInputSchema>;

/**
 * Convert deletion result to markdown
 */
function deletionToMarkdown(labelId: string): string {
  const sections: json2md.DataObject[] = [
    { h1: "Label Deleted Successfully" },
    {
      p: `Label with ID **${labelId}** has been permanently deleted from your Gmail account.`,
    },
    { h2: "Important Notes" },
    {
      ul: [
        "The label has been removed from all messages",
        "Messages are not deleted, only the label is removed",
        "This action cannot be undone",
        "Label will no longer appear in label lists or on messages",
      ],
    },
  ];

  return json2md(sections);
}

/**
 * Gmail delete label tool implementation
 */
export async function deleteLabelTool(
  gmailClient: GmailClient,
  params: DeleteLabelInput
) {
  try {
    // Check if trying to delete a system label
    if (SYSTEM_LABELS.includes(params.label_id)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: Cannot delete system label ${params.label_id}. Only user-created labels can be deleted.`,
          },
        ],
        isError: true,
      };
    }

    // Check if it looks like a system label (starts with common system prefixes)
    if (
      params.label_id.startsWith("CATEGORY_") ||
      params.label_id === params.label_id.toUpperCase()
    ) {
      // Additional check for system labels
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: Cannot delete system label ${params.label_id}. Only user-created labels can be deleted.`,
          },
        ],
        isError: true,
      };
    }

    await gmailClient.deleteLabel(params.label_id);

    const output = {
      label_id: params.label_id,
      deleted: true,
      message:
        "Label deleted successfully. The label has been removed from all messages.",
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : deletionToMarkdown(params.label_id);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if error indicates system label
    if (
      errorMessage.includes("cannot") ||
      errorMessage.includes("system") ||
      errorMessage.includes("permission")
    ) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: Cannot delete label ${params.label_id}. This appears to be a system label. Only user-created labels can be deleted.`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: `Error deleting label: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Tool description for MCP server registration
 */
export const DELETE_LABEL_DESCRIPTION = `Delete a custom Gmail label permanently.

This tool permanently deletes a user-created label from your Gmail account. System labels cannot be deleted. The label is removed from all messages, but the messages themselves are not deleted.

**IMPORTANT: This is a destructive operation that cannot be undone.**

**Parameters**:
- \`label_id\` (string, required): The label ID to delete (e.g., "Label_123")
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**System Label Protection**:
- System labels (INBOX, SENT, TRASH, STARRED, etc.) **cannot** be deleted
- Category labels (CATEGORY_PERSONAL, CATEGORY_SOCIAL, etc.) **cannot** be deleted
- Only user-created custom labels can be deleted
- Attempting to delete a system label returns a clear error message

**What Happens When You Delete a Label**:
1. The label is permanently removed from your Gmail account
2. The label is removed from all messages that had it
3. Messages are **not** deleted - only the label is removed
4. This action **cannot be undone**
5. The label will no longer appear in:
   - Label lists
   - Message labels
   - Filters or automation rules

**Returns**:
- \`label_id\`: The deleted label ID
- \`deleted\`: Always true on success
- \`message\`: Confirmation message

**Use Cases**:
- Remove unused custom labels
- Clean up label organization
- Delete obsolete or incorrectly created labels
- Remove labels that are no longer needed

**Examples**:
- Delete custom label: \`{ "label_id": "Label_123" }\`
- Delete with JSON output: \`{ "label_id": "Label_456", "output_format": "json" }\`

**Error Handling**:
- Returns error if label ID doesn't exist
- Returns error if trying to delete system labels
- Returns error if authentication lacks gmail.labels scope
- Returns clear error message explaining why deletion failed

**Safety Considerations**:
- This is a destructive operation marked with \`destructiveHint: true\`
- Consider using \`get_label\` first to verify which label you're deleting
- Use \`list_labels\` to see all labels before deletion
- There is no "undo" - once deleted, the label is gone permanently
- Messages with the label are not affected, only the label itself is removed

**Scope Requirements**:
- Requires \`gmail.labels\` or \`gmail.modify\` scope

**Alternative to Deletion**:
If you want to hide a label instead of deleting it, consider using the \`update_label\` tool to set \`label_list_visibility\` to "labelHide" instead.`;

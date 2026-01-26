/**
 * Gmail list labels tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import { createErrorResponse } from "@/utils/tool-helpers.ts";

/**
 * Input schema for gmcp_gmail_list_labels tool
 */
export const ListLabelsInputSchema = z.object({
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type ListLabelsInput = z.infer<typeof ListLabelsInputSchema>;

/**
 * Convert labels list to markdown
 */
function labelsToMarkdown(labels: {
  system: Array<{ id: string; name: string; total: number; unread: number }>;
  user: Array<{ id: string; name: string; total: number; unread: number }>;
}): string {
  const sections: json2md.DataObject[] = [{ h1: "Gmail Labels" }];

  if (labels.system.length > 0) {
    sections.push({ h2: "System Labels" });
    const systemLabels = labels.system.map(
      (label) =>
        `**${label.name}** (${label.id}) - ${label.total} total, ${label.unread} unread`
    );
    sections.push({ ul: systemLabels });
  }

  if (labels.user.length > 0) {
    sections.push({ h2: "Custom Labels" });
    const userLabels = labels.user.map(
      (label) =>
        `**${label.name}** (${label.id}) - ${label.total} total, ${label.unread} unread`
    );
    sections.push({ ul: userLabels });
  }

  if (labels.system.length === 0 && labels.user.length === 0) {
    sections.push({ p: "*No labels found*" });
  }

  return json2md(sections);
}

/**
 * Gmail list labels tool implementation
 */
export async function listLabelsTool(
  gmailClient: GmailClient,
  params: ListLabelsInput
) {
  try {
    const labels = await gmailClient.listLabels();

    const systemLabels = labels
      .filter((label) => label.type === "system")
      .map((label) => ({
        id: label.id,
        name: label.name,
        total: label.messagesTotal || 0,
        unread: label.messagesUnread || 0,
      }));

    const userLabels = labels
      .filter((label) => label.type === "user")
      .map((label) => ({
        id: label.id,
        name: label.name,
        total: label.messagesTotal || 0,
        unread: label.messagesUnread || 0,
      }));

    const output = {
      total_count: labels.length,
      system_count: systemLabels.length,
      user_count: userLabels.length,
      system: systemLabels,
      user: userLabels,
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : labelsToMarkdown({ system: systemLabels, user: userLabels });

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("listing labels", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const LIST_LABELS_DESCRIPTION = `List all Gmail labels (both system and custom labels).

This tool retrieves all labels in your Gmail account, including system labels (INBOX, SENT, etc.) and user-created custom labels. Each label includes message counts (total and unread).

**Returns**:
- \`total_count\`: Total number of labels
- \`system_count\`: Number of system labels
- \`user_count\`: Number of custom user labels
- \`system\`: Array of system labels with id, name, total, and unread counts
- \`user\`: Array of custom labels with id, name, total, and unread counts

**System Labels**:
System labels are predefined by Gmail and include:
- \`INBOX\` - Inbox
- \`SENT\` - Sent mail
- \`DRAFT\` - Drafts
- \`TRASH\` - Trash
- \`SPAM\` - Spam
- \`STARRED\` - Starred messages
- \`IMPORTANT\` - Important marker
- \`UNREAD\` - Unread status
- \`CATEGORY_*\` - Category labels (PERSONAL, SOCIAL, PROMOTIONS, etc.)

**Custom Labels**:
Custom labels are created by users for organizing emails. They have IDs like \`Label_123\` and can have any name, including nested labels using "/" (e.g., "Work/Projects").

**Parameters**:
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Use Cases**:
- Discover available labels for organizing emails
- Find label IDs for use with modify_labels or other tools
- Check message counts per label
- List all custom organizational labels

**Error Handling**:
- Returns error if authentication fails
- Returns error if Gmail API is unreachable`;

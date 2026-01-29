/**
 * Gmail get label tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import { OutputFormatSchema } from "@/schemas/shared.ts";
import { createErrorResponse } from "@/utils/tool-helpers.ts";

/**
 * Input schema for gmcp_gmail_get_label tool
 */
export const GetLabelInputSchema = z.object({
  label_id: z
    .string()
    .min(1, "Label ID cannot be empty")
    .describe("The label ID to retrieve (e.g., 'INBOX', 'Label_123')"),
  output_format: OutputFormatSchema,
});

export type GetLabelInput = z.infer<typeof GetLabelInputSchema>;

/**
 * Convert label details to markdown
 */
function labelToMarkdown(label: {
  id: string;
  name: string;
  type: "system" | "user";
  messageListVisibility?: "show" | "hide";
  labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide";
  messagesTotal?: number;
  messagesUnread?: number;
  color?: { textColor: string; backgroundColor: string };
}): string {
  const sections: json2md.DataObject[] = [
    { h1: `Label: ${label.name}` },
    { h2: "Details" },
    {
      ul: [
        `**ID:** ${label.id}`,
        `**Type:** ${label.type === "system" ? "System Label" : "Custom Label"}`,
        `**Total Messages:** ${label.messagesTotal || 0}`,
        `**Unread Messages:** ${label.messagesUnread || 0}`,
      ],
    },
  ];

  if (label.messageListVisibility || label.labelListVisibility) {
    sections.push({ h2: "Visibility Settings" });
    const visibilityItems: string[] = [];
    if (label.messageListVisibility) {
      visibilityItems.push(`**Message List:** ${label.messageListVisibility}`);
    }
    if (label.labelListVisibility) {
      visibilityItems.push(`**Label List:** ${label.labelListVisibility}`);
    }
    sections.push({ ul: visibilityItems });
  }

  if (label.color) {
    sections.push({ h2: "Color" });
    sections.push({
      ul: [
        `**Text Color:** ${label.color.textColor}`,
        `**Background Color:** ${label.color.backgroundColor}`,
      ],
    });
  }

  return json2md(sections);
}

/**
 * Gmail get label tool implementation
 */
export async function getLabelTool(
  gmailClient: GmailClient,
  params: GetLabelInput
) {
  try {
    const label = await gmailClient.getLabel(params.label_id);

    const output = {
      id: label.id,
      name: label.name,
      type: label.type,
      message_list_visibility: label.messageListVisibility || null,
      label_list_visibility: label.labelListVisibility || null,
      messages_total: label.messagesTotal || 0,
      messages_unread: label.messagesUnread || 0,
      color: label.color || null,
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : labelToMarkdown(label);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("getting label", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const GET_LABEL_DESCRIPTION = `Get detailed information about a specific Gmail label.

This tool retrieves comprehensive details about a label, including its name, type, visibility settings, message counts, and color configuration.

**Parameters**:
- \`label_id\` (string, required): The label ID to retrieve (e.g., "INBOX", "Label_123")
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`id\`: Label ID
- \`name\`: Label name
- \`type\`: "system" or "user"
- \`message_list_visibility\`: How label appears in message list ("show" or "hide")
- \`label_list_visibility\`: How label appears in label list ("labelShow", "labelShowIfUnread", or "labelHide")
- \`messages_total\`: Total number of messages with this label
- \`messages_unread\`: Number of unread messages with this label
- \`color\`: Label color configuration (textColor and backgroundColor)

**Label Types**:
- **System Labels**: Predefined Gmail labels like INBOX, SENT, TRASH, STARRED, etc.
- **Custom Labels**: User-created labels with IDs like "Label_123"

**Visibility Settings**:
- \`messageListVisibility\`: Controls if messages with this label show in message list
- \`labelListVisibility\`: Controls how label appears in left sidebar label list

**Use Cases**:
- Check message counts for a specific label
- View label configuration and settings
- Verify label exists before using in other operations
- Check color settings for custom labels

**Examples**:
- Get inbox details: \`{ "label_id": "INBOX" }\`
- Get custom label: \`{ "label_id": "Label_123" }\`
- Get starred label info: \`{ "label_id": "STARRED" }\`

**Error Handling**:
- Returns error if label ID doesn't exist
- Returns error if authentication fails
- System labels and custom labels are both supported`;

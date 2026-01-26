/**
 * Gmail create label tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";

/**
 * Input schema for gmcp_gmail_create_label tool
 */
export const CreateLabelInputSchema = z.object({
  name: z
    .string()
    .min(1, "Label name cannot be empty")
    .describe(
      "The label name (e.g., 'Work', 'Personal/Family'). Use '/' for nested labels."
    ),
  message_list_visibility: z
    .enum(["show", "hide"])
    .optional()
    .describe(
      "How label appears in message list. Default: 'show'. Use 'hide' to hide messages with this label from message list."
    ),
  label_list_visibility: z
    .enum(["labelShow", "labelShowIfUnread", "labelHide"])
    .optional()
    .describe(
      "How label appears in label list. Default: 'labelShow'. Options: 'labelShow' (always visible), 'labelShowIfUnread' (only when unread), 'labelHide' (hidden)."
    ),
  background_color: z
    .string()
    .optional()
    .describe(
      "Background color in hex format (e.g., '#ff0000'). Must provide both background and text color together."
    ),
  text_color: z
    .string()
    .optional()
    .describe(
      "Text color in hex format (e.g., '#ffffff'). Must provide both background and text color together."
    ),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type CreateLabelInput = z.infer<typeof CreateLabelInputSchema>;

/**
 * Convert created label to markdown
 */
function createdLabelToMarkdown(label: {
  id: string;
  name: string;
  type: "system" | "user";
  messageListVisibility?: "show" | "hide";
  labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide";
  color?: { textColor: string; backgroundColor: string };
}): string {
  const sections: json2md.DataObject[] = [
    { h1: "Label Created Successfully" },
    { h2: "Details" },
    {
      ul: [
        `**Name:** ${label.name}`,
        `**ID:** ${label.id}`,
        "**Type:** Custom Label",
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

  sections.push({
    p: `You can now use this label ID (${label.id}) with other tools like modify_labels or batch_modify.`,
  });

  return json2md(sections);
}

/**
 * Gmail create label tool implementation
 */
export async function createLabelTool(
  gmailClient: GmailClient,
  params: CreateLabelInput
) {
  try {
    // Validate color parameters
    if (
      (params.background_color && !params.text_color) ||
      (!params.background_color && params.text_color)
    ) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: Both background_color and text_color must be provided together",
          },
        ],
        isError: true,
      };
    }

    const label = await gmailClient.createLabel(
      params.name,
      params.message_list_visibility,
      params.label_list_visibility,
      params.background_color,
      params.text_color
    );

    const output = {
      id: label.id,
      name: label.name,
      type: label.type,
      message_list_visibility: label.messageListVisibility || null,
      label_list_visibility: label.labelListVisibility || null,
      color: label.color || null,
      created: true,
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : createdLabelToMarkdown(label);

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
          text: `Error creating label: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Tool description for MCP server registration
 */
export const CREATE_LABEL_DESCRIPTION = `Create a new custom Gmail label for organizing emails.

This tool creates a new label with customizable visibility and color settings. Labels are used to organize and categorize emails in Gmail.

**Parameters**:
- \`name\` (string, required): The label name. Can include "/" for nested labels (e.g., "Work/Projects")
- \`message_list_visibility\` (string, optional): How label appears in message list
  - "show" (default): Messages with this label appear in message list
  - "hide": Messages with this label are hidden from message list
- \`label_list_visibility\` (string, optional): How label appears in label list (sidebar)
  - "labelShow" (default): Always visible in label list
  - "labelShowIfUnread": Only visible when there are unread messages
  - "labelHide": Hidden from label list
- \`background_color\` (string, optional): Background color in hex format (e.g., "#ff0000")
- \`text_color\` (string, optional): Text color in hex format (e.g., "#ffffff")
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Color Settings**:
- Both \`background_color\` and \`text_color\` must be provided together
- Colors should be in hex format (e.g., "#ff0000" for red)
- Gmail API will validate colors and may reject invalid combinations

**Nested Labels**:
- Use "/" in label name to create nested labels (e.g., "Work/Projects/2024")
- Gmail automatically creates parent labels if they don't exist
- Nested labels appear hierarchically in the label list

**Returns**:
- \`id\`: The newly created label ID (e.g., "Label_123")
- \`name\`: The label name
- \`type\`: Always "user" for custom labels
- \`message_list_visibility\`: Applied message list visibility
- \`label_list_visibility\`: Applied label list visibility
- \`color\`: Applied color settings (if provided)
- \`created\`: Always true on success

**Use Cases**:
- Create organizational labels (Work, Personal, Projects, etc.)
- Create nested label hierarchies for detailed organization
- Set up labels with custom colors for visual organization
- Create labels to use with filters and automation

**Examples**:
- Simple label: \`{ "name": "Important" }\`
- Nested label: \`{ "name": "Work/Projects/Q1-2024" }\`
- Colored label: \`{ "name": "Urgent", "background_color": "#ff0000", "text_color": "#ffffff" }\`
- Hidden label: \`{ "name": "Archive", "label_list_visibility": "labelHide" }\`

**Error Handling**:
- Returns error if label name already exists
- Returns error if colors are invalid or only one color is provided
- Returns error if authentication lacks gmail.labels scope
- Requires \`gmail.labels\` scope for label creation

**Scope Requirements**:
- Requires \`gmail.labels\` or \`gmail.modify\` scope`;

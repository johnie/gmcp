/**
 * Gmail update label tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";

/**
 * System labels that cannot be renamed
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
];

/**
 * Input schema for gmcp_gmail_update_label tool
 */
export const UpdateLabelInputSchema = z.object({
  label_id: z
    .string()
    .min(1, "Label ID cannot be empty")
    .describe("The label ID to update (e.g., 'Label_123' or 'INBOX')"),
  name: z
    .string()
    .optional()
    .describe(
      "New label name. Cannot rename system labels. Use '/' for nested labels."
    ),
  message_list_visibility: z
    .enum(["show", "hide"])
    .optional()
    .describe("How label appears in message list"),
  label_list_visibility: z
    .enum(["labelShow", "labelShowIfUnread", "labelHide"])
    .optional()
    .describe("How label appears in label list (sidebar)"),
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

export type UpdateLabelInput = z.infer<typeof UpdateLabelInputSchema>;

/**
 * Convert updated label to markdown
 */
function updatedLabelToMarkdown(
  label: {
    id: string;
    name: string;
    type: "system" | "user";
    messageListVisibility?: "show" | "hide";
    labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide";
    color?: { textColor: string; backgroundColor: string };
  },
  updates: {
    name?: boolean;
    visibility?: boolean;
    color?: boolean;
  }
): string {
  const sections: json2md.DataObject[] = [
    { h1: "Label Updated Successfully" },
    { h2: "Details" },
    {
      ul: [
        `**Name:** ${label.name}`,
        `**ID:** ${label.id}`,
        `**Type:** ${label.type === "system" ? "System Label" : "Custom Label"}`,
      ],
    },
  ];

  const changedItems: string[] = [];
  if (updates.name) {
    changedItems.push("Name");
  }
  if (updates.visibility) {
    changedItems.push("Visibility settings");
  }
  if (updates.color) {
    changedItems.push("Color");
  }

  if (changedItems.length > 0) {
    sections.push({ h2: "Changes Applied" });
    sections.push({ ul: changedItems });
  }

  if (label.messageListVisibility || label.labelListVisibility) {
    sections.push({ h2: "Current Visibility Settings" });
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
    sections.push({ h2: "Current Color" });
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
 * Gmail update label tool implementation
 */
export async function updateLabelTool(
  gmailClient: GmailClient,
  params: UpdateLabelInput
) {
  try {
    // Check if trying to rename a system label
    if (params.name && SYSTEM_LABELS.includes(params.label_id)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: Cannot rename system label ${params.label_id}. System labels can only have visibility settings updated, not renamed.`,
          },
        ],
        isError: true,
      };
    }

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

    // Check if any updates were provided
    if (
      !(
        params.name ||
        params.message_list_visibility ||
        params.label_list_visibility ||
        params.background_color ||
        params.text_color
      )
    ) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Error: At least one field to update must be provided (name, visibility, or color)",
          },
        ],
        isError: true,
      };
    }

    const label = await gmailClient.updateLabel(
      params.label_id,
      params.name,
      params.message_list_visibility,
      params.label_list_visibility,
      params.background_color,
      params.text_color
    );

    const updates = {
      name: !!params.name,
      visibility: !!(
        params.message_list_visibility || params.label_list_visibility
      ),
      color: !!(params.background_color && params.text_color),
    };

    const output = {
      id: label.id,
      name: label.name,
      type: label.type,
      message_list_visibility: label.messageListVisibility || null,
      label_list_visibility: label.labelListVisibility || null,
      color: label.color || null,
      updated: true,
      changes: updates,
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : updatedLabelToMarkdown(label, updates);

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
          text: `Error updating label: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Tool description for MCP server registration
 */
export const UPDATE_LABEL_DESCRIPTION = `Update an existing Gmail label's name, visibility, or color settings.

This tool modifies label properties. System labels (INBOX, SENT, etc.) can only have visibility updated, not renamed. Custom labels can have all properties updated.

**Parameters**:
- \`label_id\` (string, required): The label ID to update (e.g., "Label_123" or "INBOX")
- \`name\` (string, optional): New label name. Use "/" for nested labels. Cannot rename system labels.
- \`message_list_visibility\` (string, optional): How label appears in message list
  - "show": Messages with this label appear in message list
  - "hide": Messages with this label are hidden from message list
- \`label_list_visibility\` (string, optional): How label appears in label list (sidebar)
  - "labelShow": Always visible in label list
  - "labelShowIfUnread": Only visible when there are unread messages
  - "labelHide": Hidden from label list
- \`background_color\` (string, optional): Background color in hex format (e.g., "#ff0000")
- \`text_color\` (string, optional): Text color in hex format (e.g., "#ffffff")
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**System Label Restrictions**:
- System labels (INBOX, SENT, DRAFT, TRASH, SPAM, STARRED, IMPORTANT, UNREAD) cannot be renamed
- System labels can have visibility settings updated
- Some system labels may reject certain visibility changes based on Gmail's rules
- Attempting to rename a system label returns an error

**Custom Label Updates**:
- Custom labels can be renamed, including changing nested structure
- All visibility and color properties can be updated
- Renaming to include "/" creates nested label hierarchy

**Color Settings**:
- Both \`background_color\` and \`text_color\` must be provided together
- Colors should be in hex format (e.g., "#ff0000" for red)
- To remove colors, omit both color parameters (not currently supported by Gmail API)

**Returns**:
- \`id\`: The label ID
- \`name\`: Updated label name
- \`type\`: "system" or "user"
- \`message_list_visibility\`: Current message list visibility
- \`label_list_visibility\`: Current label list visibility
- \`color\`: Current color settings
- \`updated\`: Always true on success
- \`changes\`: Object indicating which properties were updated

**Use Cases**:
- Rename custom labels for better organization
- Change label colors for visual distinction
- Update visibility settings to hide/show labels
- Restructure labels by changing nested hierarchy

**Examples**:
- Rename label: \`{ "label_id": "Label_123", "name": "Work/Important" }\`
- Change color: \`{ "label_id": "Label_123", "background_color": "#ff0000", "text_color": "#ffffff" }\`
- Hide from sidebar: \`{ "label_id": "Label_123", "label_list_visibility": "labelHide" }\`
- Update system label visibility: \`{ "label_id": "INBOX", "label_list_visibility": "labelShowIfUnread" }\`

**Error Handling**:
- Returns error if trying to rename system labels
- Returns error if label ID doesn't exist
- Returns error if colors are invalid or only one color is provided
- Returns error if no update parameters are provided
- Returns error if authentication lacks gmail.labels scope
- Requires at least one field to update

**Scope Requirements**:
- Requires \`gmail.labels\` or \`gmail.modify\` scope`;

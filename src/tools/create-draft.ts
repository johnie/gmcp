/**
 * Gmail create draft tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import { createErrorResponse } from "@/utils/tool-helpers.ts";

/**
 * Input schema for gmail_create_draft tool
 */
export const CreateDraftInputSchema = z.object({
  to: z
    .email("Must be a valid email address")
    .describe("Recipient email address"),
  subject: z
    .string()
    .min(1, "Subject cannot be empty")
    .describe("Email subject"),
  body: z
    .string()
    .min(1, "Body cannot be empty")
    .describe("Email body content"),
  content_type: z
    .enum(["text/plain", "text/html"])
    .default("text/plain")
    .describe(
      "Content type: text/plain (default) or text/html for HTML emails"
    ),
  cc: z
    .email("CC must be a valid email address")
    .optional()
    .describe("CC (carbon copy) email address"),
  bcc: z
    .email("BCC must be a valid email address")
    .optional()
    .describe("BCC (blind carbon copy) email address"),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type CreateDraftInput = z.infer<typeof CreateDraftInputSchema>;

/**
 * Convert draft creation result to markdown
 */
function draftCreatedToMarkdown(
  params: {
    to: string;
    subject: string;
    cc?: string;
    bcc?: string;
  },
  result: { id: string; message: { id: string; threadId: string } }
): string {
  const sections: json2md.DataObject[] = [
    { h1: "✅ Draft Created Successfully" },
    { h2: "Draft Details" },
    {
      ul: [
        `**To:** ${params.to}`,
        ...(params.cc ? [`**CC:** ${params.cc}`] : []),
        ...(params.bcc ? [`**BCC:** ${params.bcc}`] : []),
        `**Subject:** ${params.subject}`,
        `**Draft ID:** ${result.id}`,
        `**Message ID:** ${result.message.id}`,
      ],
    },
    {
      p: "The draft has been saved and will appear in your Drafts folder. You can edit and send it later from Gmail.",
    },
  ];

  return json2md(sections);
}

/**
 * Gmail create draft tool implementation
 */
export async function createDraftTool(
  gmailClient: GmailClient,
  params: CreateDraftInput
) {
  try {
    const result = await gmailClient.createDraft(
      params.to,
      params.subject,
      params.body,
      params.content_type,
      params.cc,
      params.bcc
    );

    const output = {
      created: true,
      draft_id: result.id,
      message_id: result.message.id,
      thread_id: result.message.threadId,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      content_type: params.content_type,
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : draftCreatedToMarkdown(params, result);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("creating draft", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const CREATE_DRAFT_DESCRIPTION = `Create a Gmail draft email that can be edited and sent later.

This tool creates a draft email in your Gmail Drafts folder. Unlike sending an email directly, drafts are saved but not sent, allowing you to review, edit, or send them later through the Gmail interface.

**Use Case**:
- Compose emails for later review
- Prepare emails that need approval before sending
- Create email templates
- Save work-in-progress emails

**Parameters**:
- \`to\` (string, required): Recipient email address
- \`subject\` (string, required): Email subject line
- \`body\` (string, required): Email body content
- \`content_type\` (string, optional): "text/plain" (default) or "text/html" for HTML emails
- \`cc\` (string, optional): CC email address
- \`bcc\` (string, optional): BCC email address
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`created\`: Always true on success
- \`draft_id\`: Draft ID (for future operations)
- \`message_id\`: Associated message ID
- \`thread_id\`: Thread ID
- \`to\`, \`cc\`, \`bcc\`: Recipients
- \`subject\`: Email subject
- \`content_type\`: Content type used

**Examples**:
- Simple draft: \`{ "to": "user@example.com", "subject": "Follow up", "body": "Hi there!" }\`
- HTML draft: \`{ "to": "user@example.com", "subject": "Newsletter", "body": "<h1>News</h1>", "content_type": "text/html" }\`
- With CC/BCC: \`{ "to": "user@example.com", "cc": "manager@example.com", "bcc": "archive@example.com", "subject": "Report", "body": "Quarterly report attached" }\`

**HTML Emails**:
- Set \`content_type: "text/html"\`
- Body should contain valid HTML
- Supported tags: h1-h6, p, a, strong, em, ul, ol, li, br, img

**Comparison with send_email**:
- \`create_draft\`: Saves to Drafts folder, does not send
- \`send_email\`: Sends immediately (with confirmation)

**Draft Management**:
- Created drafts appear in Gmail's Drafts folder
- Can be edited in Gmail web or mobile app
- Can be sent later using Gmail interface
- Draft ID can be used with other draft tools (update_draft, delete_draft)

**Error Handling**:
- Returns error if email addresses are invalid
- Returns error if authentication lacks compose permissions
- Returns error if Gmail API fails

**Permissions**:
- Requires \`gmail.compose\` or \`gmail.modify\` scope

**Workflow**:
1. Create draft with email content
2. Draft is saved to Drafts folder
3. Review/edit in Gmail if needed
4. Send from Gmail when ready

**Benefits**:
- Safe: No risk of accidentally sending
- Flexible: Can be edited before sending
- Convenient: Pre-compose emails for later
- Collaborative: Others with access can review drafts`;

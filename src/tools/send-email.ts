/**
 * Gmail send email tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";
import { createErrorResponse } from "@/utils/tool-helpers.ts";

/**
 * Input schema for gmail_send_email tool
 */
export const SendEmailInputSchema = z.object({
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
  confirm: z
    .boolean()
    .default(false)
    .describe(
      "Set to true to confirm and send the email. If false, returns preview only."
    ),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

/**
 * Convert email preview to markdown
 */
function emailPreviewToMarkdown(params: {
  to: string;
  subject: string;
  body: string;
  content_type: string;
  cc?: string;
  bcc?: string;
}): string {
  const sections: json2md.DataObject[] = [
    { h1: "Email Preview - NOT SENT" },
    {
      p: "⚠️ **This email has not been sent yet.** Set `confirm: true` to send.",
    },
    { h2: "Email Details" },
    {
      ul: [
        `**To:** ${params.to}`,
        ...(params.cc ? [`**CC:** ${params.cc}`] : []),
        ...(params.bcc ? [`**BCC:** ${params.bcc}`] : []),
        `**Subject:** ${params.subject}`,
        `**Content Type:** ${params.content_type}`,
      ],
    },
    { h2: "Body" },
    { p: params.body },
  ];

  return json2md(sections);
}

/**
 * Convert sent email confirmation to markdown
 */
function emailSentToMarkdown(
  params: {
    to: string;
    subject: string;
    cc?: string;
    bcc?: string;
  },
  result: { id: string; threadId: string }
): string {
  const sections: json2md.DataObject[] = [
    { h1: "✅ Email Sent Successfully" },
    { h2: "Message Details" },
    {
      ul: [
        `**To:** ${params.to}`,
        ...(params.cc ? [`**CC:** ${params.cc}`] : []),
        ...(params.bcc ? [`**BCC:** ${params.bcc}`] : []),
        `**Subject:** ${params.subject}`,
        `**Message ID:** ${result.id}`,
        `**Thread ID:** ${result.threadId}`,
      ],
    },
    {
      p: "The email has been sent and will appear in your Sent folder.",
    },
  ];

  return json2md(sections);
}

/**
 * Gmail send email tool implementation
 */
export async function sendEmailTool(
  gmailClient: GmailClient,
  params: SendEmailInput
) {
  try {
    // Preview mode - don't send
    if (!params.confirm) {
      const output = {
        status: "preview",
        sent: false,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        body: params.body,
        content_type: params.content_type,
        warning:
          "Email NOT sent. Set confirm:true to actually send this email.",
      };

      const textContent =
        params.output_format === "json"
          ? JSON.stringify(output, null, 2)
          : emailPreviewToMarkdown(params);

      return {
        content: [{ type: "text" as const, text: textContent }],
        structuredContent: output,
      };
    }

    // Actually send the email
    const result = await gmailClient.sendEmail(
      params.to,
      params.subject,
      params.body,
      params.content_type,
      params.cc,
      params.bcc
    );

    const output = {
      status: "sent",
      sent: true,
      message_id: result.id,
      thread_id: result.threadId,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      label_ids: result.labelIds,
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : emailSentToMarkdown(params, result);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("sending email", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const SEND_EMAIL_DESCRIPTION = `Send a new Gmail email with optional CC/BCC and HTML support.

This tool sends email through your Gmail account. It includes a safety feature: by default it shows a preview without sending. You must explicitly set \`confirm: true\` to actually send the email.

**Safety Feature**:
- Default behavior: Shows preview only, does NOT send
- To actually send: Set \`confirm: true\`
- This prevents accidental sends

**Parameters**:
- \`to\` (string, required): Recipient email address
- \`subject\` (string, required): Email subject line
- \`body\` (string, required): Email body content
- \`content_type\` (string, optional): "text/plain" (default) or "text/html" for HTML emails
- \`cc\` (string, optional): CC email address
- \`bcc\` (string, optional): BCC email address
- \`confirm\` (boolean, required): Must be true to actually send (default: false)
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns** (preview mode):
- \`status\`: "preview"
- \`sent\`: false
- Email details for review
- Warning message

**Returns** (sent mode):
- \`status\`: "sent"
- \`sent\`: true
- \`message_id\`: Sent message ID
- \`thread_id\`: Thread ID
- \`label_ids\`: Applied labels

**Examples**:
- Preview: \`{ "to": "user@example.com", "subject": "Hello", "body": "Hi there!" }\`
- Send plain text: \`{ "to": "user@example.com", "subject": "Hello", "body": "Hi!", "confirm": true }\`
- Send HTML: \`{ "to": "user@example.com", "subject": "Newsletter", "body": "<h1>Hello</h1>", "content_type": "text/html", "confirm": true }\`
- With CC: \`{ "to": "user@example.com", "cc": "boss@example.com", "subject": "Report", "body": "See attached", "confirm": true }\`

**HTML Emails**:
- Set \`content_type: "text/html"\`
- Body should contain valid HTML
- Basic HTML tags supported: h1-h6, p, a, strong, em, ul, ol, li, br

**Error Handling**:
- Returns error if email addresses are invalid
- Returns error if authentication lacks send permissions
- Returns error if Gmail API fails

**Permissions**:
- Requires \`gmail.send\` or \`gmail.compose\` scope

**Use Cases**:
- Send automated email notifications
- Reply to inquiries
- Send reports or summaries
- Compose and send HTML newsletters

**Workflow**:
1. First call without \`confirm\` to preview
2. Review the preview output
3. Call again with \`confirm: true\` to send`;

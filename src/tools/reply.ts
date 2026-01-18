/**
 * Gmail reply tool for MCP Server
 */

import json2md from "json2md";
import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";

/**
 * Input schema for gmail_reply tool
 */
export const ReplyInputSchema = z.object({
  message_id: z
    .string()
    .min(1, "Message ID cannot be empty")
    .describe("The Gmail message ID to reply to"),
  body: z
    .string()
    .min(1, "Reply body cannot be empty")
    .describe("Reply message body"),
  content_type: z
    .enum(["text/plain", "text/html"])
    .default("text/plain")
    .describe(
      "Content type: text/plain (default) or text/html for HTML replies"
    ),
  cc: z
    .string()
    .email("CC must be a valid email address")
    .optional()
    .describe("CC (carbon copy) email address"),
  confirm: z
    .boolean()
    .default(false)
    .describe(
      "Set to true to confirm and send the reply. If false, returns preview only."
    ),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type ReplyInput = z.infer<typeof ReplyInputSchema>;

/**
 * Convert reply preview to markdown
 */
function replyPreviewToMarkdown(
  originalEmail: {
    subject: string;
    from: string;
    to: string;
    date: string;
  },
  replyBody: string,
  contentType: string,
  cc?: string
): string {
  const sections: json2md.DataObject[] = [
    { h1: "Reply Preview - NOT SENT" },
    {
      p: "⚠️ **This reply has not been sent yet.** Set `confirm: true` to send.",
    },
    { h2: "Original Message" },
    {
      ul: [
        `**From:** ${originalEmail.from}`,
        `**Subject:** ${originalEmail.subject}`,
        `**Date:** ${originalEmail.date}`,
      ],
    },
    { h2: "Your Reply" },
    {
      ul: [
        `**To:** ${originalEmail.from}`,
        ...(cc ? [`**CC:** ${cc}`] : []),
        `**Subject:** Re: ${originalEmail.subject}`,
        `**Content Type:** ${contentType}`,
      ],
    },
    { h2: "Reply Body" },
    { p: replyBody },
  ];

  return json2md(sections);
}

/**
 * Convert sent reply confirmation to markdown
 */
function replySentToMarkdown(
  originalEmail: {
    subject: string;
    from: string;
  },
  result: { id: string; threadId: string },
  cc?: string
): string {
  const sections: json2md.DataObject[] = [
    { h1: "✅ Reply Sent Successfully" },
    { h2: "Reply Details" },
    {
      ul: [
        `**To:** ${originalEmail.from}`,
        ...(cc ? [`**CC:** ${cc}`] : []),
        `**Subject:** Re: ${originalEmail.subject}`,
        `**Message ID:** ${result.id}`,
        `**Thread ID:** ${result.threadId}`,
      ],
    },
    {
      p: "Your reply has been sent and added to the conversation thread.",
    },
  ];

  return json2md(sections);
}

/**
 * Gmail reply tool implementation
 */
export async function replyTool(gmailClient: GmailClient, params: ReplyInput) {
  try {
    // First, get the original message to extract details
    const originalMessage = await gmailClient.getMessage(params.message_id);

    // Preview mode - don't send
    if (!params.confirm) {
      const output = {
        status: "preview",
        sent: false,
        original_message: {
          id: originalMessage.id,
          thread_id: originalMessage.threadId,
          subject: originalMessage.subject,
          from: originalMessage.from,
          date: originalMessage.date,
        },
        reply: {
          to: originalMessage.from,
          cc: params.cc,
          subject: `Re: ${originalMessage.subject}`,
          body: params.body,
          content_type: params.content_type,
        },
        warning:
          "Reply NOT sent. Set confirm:true to actually send this reply.",
      };

      const textContent =
        params.output_format === "json"
          ? JSON.stringify(output, null, 2)
          : replyPreviewToMarkdown(
              originalMessage,
              params.body,
              params.content_type,
              params.cc
            );

      return {
        content: [{ type: "text" as const, text: textContent }],
        structuredContent: output,
      };
    }

    // Actually send the reply
    const result = await gmailClient.replyToEmail(
      originalMessage.from,
      originalMessage.subject,
      params.body,
      originalMessage.threadId,
      originalMessage.id,
      params.content_type,
      params.cc
    );

    const output = {
      status: "sent",
      sent: true,
      message_id: result.id,
      thread_id: result.threadId,
      original_message_id: params.message_id,
      to: originalMessage.from,
      cc: params.cc,
      subject: `Re: ${originalMessage.subject}`,
      label_ids: result.labelIds,
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : replySentToMarkdown(originalMessage, result, params.cc);

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
          text: `Error sending reply: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Tool description for MCP server registration
 */
export const REPLY_DESCRIPTION = `Reply to an existing Gmail email in its conversation thread.

This tool sends a reply to an existing email, automatically threading it in the conversation. It includes a safety feature: by default it shows a preview without sending. You must explicitly set \`confirm: true\` to actually send the reply.

**Safety Feature**:
- Default behavior: Shows preview only, does NOT send
- To actually send: Set \`confirm: true\`
- This prevents accidental sends

**Automatic Threading**:
- Reply is automatically added to the conversation thread
- Subject line gets "Re:" prefix
- Recipient is the sender of the original message
- Thread ID is preserved for conversation continuity

**Parameters**:
- \`message_id\` (string, required): The message ID to reply to
- \`body\` (string, required): Your reply message body
- \`content_type\` (string, optional): "text/plain" (default) or "text/html"
- \`cc\` (string, optional): CC email address
- \`confirm\` (boolean, required): Must be true to actually send (default: false)
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns** (preview mode):
- \`status\`: "preview"
- \`sent\`: false
- \`original_message\`: Details of message being replied to
- \`reply\`: Preview of your reply
- Warning message

**Returns** (sent mode):
- \`status\`: "sent"
- \`sent\`: true
- \`message_id\`: Reply message ID
- \`thread_id\`: Conversation thread ID
- \`original_message_id\`: Original message ID
- \`label_ids\`: Applied labels

**Examples**:
- Preview: \`{ "message_id": "18f3c5d4e8a2b1c0", "body": "Thanks for your email!" }\`
- Send reply: \`{ "message_id": "18f3c5d4e8a2b1c0", "body": "Thanks!", "confirm": true }\`
- HTML reply: \`{ "message_id": "18f3c5d4e8a2b1c0", "body": "<p>Thanks!</p>", "content_type": "text/html", "confirm": true }\`
- With CC: \`{ "message_id": "18f3c5d4e8a2b1c0", "body": "Noted", "cc": "boss@example.com", "confirm": true }\`

**How It Works**:
1. Fetches original message to get sender, subject, and thread ID
2. Constructs reply with proper headers (In-Reply-To, References)
3. Sends reply in the same thread
4. Reply appears in Gmail as part of the conversation

**Error Handling**:
- Returns error if message ID doesn't exist
- Returns error if authentication lacks send permissions
- Returns error if Gmail API fails

**Permissions**:
- Requires \`gmail.send\` or \`gmail.compose\` scope
- Requires \`gmail.readonly\` to fetch original message

**Use Cases**:
- Respond to customer inquiries
- Continue email conversations
- Send acknowledgments
- Reply to notifications

**Workflow**:
1. Use \`search_emails\` or \`get_email\` to find message
2. Call without \`confirm\` to preview reply
3. Review the preview
4. Call with \`confirm: true\` to send`;

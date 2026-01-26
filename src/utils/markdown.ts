/**
 * Markdown formatting utilities using json2md
 */

import json2md from "json2md";

/**
 * Email data structure for markdown conversion
 */
interface EmailData {
  id: string;
  thread_id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
  labels?: string[];
}

/**
 * Search results structure
 */
interface SearchResultData {
  total_estimate: number;
  count: number;
  has_more: boolean;
  next_page_token?: string;
  emails: EmailData[];
}

/**
 * Convert a single email to json2md format
 */
function emailToJson2md(email: EmailData) {
  const elements: json2md.DataObject[] = [
    { h2: email.subject },
    {
      ul: [
        `**From**: ${email.from}`,
        `**To**: ${email.to}`,
        `**Date**: ${email.date}`,
        `**ID**: ${email.id}`,
        `**Thread ID**: ${email.thread_id}`,
        ...(email.labels && email.labels.length > 0
          ? [`**Labels**: ${email.labels.join(", ")}`]
          : []),
      ],
    },
    { p: `**Snippet**: ${email.snippet}` },
  ];

  if (email.body) {
    const bodyPreview =
      email.body.length > 500
        ? `${email.body.substring(0, 500)}...`
        : email.body;
    elements.push({ p: "**Body**:" }, { code: { content: bodyPreview } });
  }

  elements.push({ hr: "" });

  return elements;
}

/**
 * Convert search results to Markdown using json2md
 */
export function searchResultsToMarkdown(
  query: string,
  data: SearchResultData
): string {
  const elements: json2md.DataObject[] = [
    { h1: `Gmail Search Results: "${query}"` },
    {
      p: `Found approximately ${data.total_estimate} emails (showing ${data.count})`,
    },
  ];

  if (data.emails.length === 0) {
    elements.push({ p: "No emails found matching the query." });
  } else {
    for (const email of data.emails) {
      elements.push(...emailToJson2md(email));
    }

    if (data.has_more && data.next_page_token) {
      elements.push({
        p: `**Note**: More results available. Use page_token: "${data.next_page_token}" to fetch the next page.`,
      });
    }
  }

  return json2md(elements);
}

/**
 * Convert single email to markdown format
 */
export function emailToMarkdown(email: EmailData): string {
  const sections: json2md.DataObject[] = [
    { h1: email.subject },
    {
      ul: [
        `**From:** ${email.from}`,
        `**To:** ${email.to}`,
        `**Date:** ${email.date}`,
        `**Message ID:** ${email.id}`,
        `**Thread ID:** ${email.thread_id}`,
      ],
    },
  ];

  if (email.labels && email.labels.length > 0) {
    sections.push({
      p: `**Labels:** ${email.labels.join(", ")}`,
    });
  }

  if (email.body) {
    sections.push({ h2: "Body" });
    sections.push({ p: email.body });
  } else {
    sections.push({ h2: "Snippet" });
    sections.push({ p: email.snippet });
  }

  return json2md(sections);
}

/**
 * Convert thread to markdown format
 */
export function threadToMarkdown(
  threadId: string,
  messages: EmailData[]
): string {
  const sections: json2md.DataObject[] = [
    { h1: `Thread: ${messages[0]?.subject || "Conversation"}` },
    {
      p: `**Thread ID:** ${threadId} | **Messages:** ${messages.length}`,
    },
  ];

  for (const [index, message] of messages.entries()) {
    sections.push({ h2: `Message ${index + 1}` });
    sections.push({
      ul: [
        `**From:** ${message.from}`,
        `**To:** ${message.to}`,
        `**Date:** ${message.date}`,
        `**Message ID:** ${message.id}`,
      ],
    });

    if (message.labels && message.labels.length > 0) {
      sections.push({
        p: `**Labels:** ${message.labels.join(", ")}`,
      });
    }

    if (message.body) {
      sections.push({ h3: "Body" });
      sections.push({ p: message.body });
    } else {
      sections.push({ h3: "Snippet" });
      sections.push({ p: message.snippet });
    }

    if (index < messages.length - 1) {
      sections.push({ p: "---" });
    }
  }

  return json2md(sections);
}

/**
 * Convert label modification result to markdown
 */
export function labelModificationToMarkdown(
  email: EmailData,
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
      email.labels && email.labels.length > 0
        ? email.labels.join(", ")
        : "*No labels on this message*",
  });

  return json2md(sections);
}

/**
 * Convert batch modification result to markdown
 */
export function batchModificationToMarkdown(
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
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Attachment structure for markdown conversion
 */
interface AttachmentData {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

/**
 * Convert attachments to markdown format
 */
export function attachmentsToMarkdown(
  messageId: string,
  attachments: AttachmentData[]
): string {
  const sections: json2md.DataObject[] = [
    { h1: "Email Attachments" },
    {
      p: `**Message ID:** ${messageId} | **Total Attachments:** ${attachments.length}`,
    },
  ];

  if (attachments.length === 0) {
    sections.push({ p: "*No attachments found in this email.*" });
  } else {
    for (const [index, attachment] of attachments.entries()) {
      sections.push({ h2: `${index + 1}. ${attachment.filename}` });
      sections.push({
        ul: [
          `**Type:** ${attachment.mimeType}`,
          `**Size:** ${formatBytes(attachment.size)}`,
          `**Attachment ID:** ${attachment.attachmentId}`,
        ],
      });
    }
  }

  return json2md(sections);
}

/**
 * Email parameters for send/reply previews
 */
interface EmailPreviewParams {
  to: string;
  subject: string;
  body: string;
  content_type: string;
  cc?: string;
  bcc?: string;
}

/**
 * Convert email preview to markdown
 */
export function emailPreviewToMarkdown(params: EmailPreviewParams): string {
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
 * Email send result for markdown conversion
 */
interface EmailSendResult {
  id: string;
  threadId: string;
}

/**
 * Convert sent email confirmation to markdown
 */
export function emailSentToMarkdown(
  params: { to: string; subject: string; cc?: string; bcc?: string },
  result: EmailSendResult
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
 * Original email for reply preview
 */
interface OriginalEmail {
  subject: string;
  from: string;
  to: string;
  date: string;
}

/**
 * Convert reply preview to markdown
 */
export function replyPreviewToMarkdown(
  originalEmail: OriginalEmail,
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
export function replySentToMarkdown(
  originalEmail: { subject: string; from: string },
  result: EmailSendResult,
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
 * Draft creation result for markdown conversion
 */
interface DraftCreateResult {
  id: string;
  message: {
    id: string;
    threadId: string;
  };
}

/**
 * Convert draft creation result to markdown
 */
export function draftCreatedToMarkdown(
  params: { to: string; subject: string; cc?: string; bcc?: string },
  result: DraftCreateResult
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

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

/**
 * Calendar data structure for markdown conversion
 */
interface CalendarData {
  id: string;
  summary: string;
  description?: string;
  timezone?: string;
  primary?: boolean;
  access_role?: string;
  background_color?: string;
  foreground_color?: string;
}

/**
 * Calendar list result structure
 */
interface CalendarListData {
  count: number;
  calendars: CalendarData[];
}

/**
 * Convert calendar list to markdown
 */
export function calendarListToMarkdown(data: CalendarListData): string {
  const sections: json2md.DataObject[] = [
    { h1: "Google Calendars" },
    { p: `**Total Calendars:** ${data.count}` },
  ];

  if (data.calendars.length === 0) {
    sections.push({ p: "No calendars found." });
  } else {
    for (const calendar of data.calendars) {
      sections.push({ h2: calendar.summary });
      const details: string[] = [
        `**ID:** ${calendar.id}`,
        `**Timezone:** ${calendar.timezone || "Not set"}`,
        `**Access Role:** ${calendar.access_role || "Unknown"}`,
      ];

      if (calendar.primary) {
        details.push("**Primary:** Yes");
      }
      if (calendar.description) {
        details.push(`**Description:** ${calendar.description}`);
      }

      sections.push({ ul: details });
    }
  }

  return json2md(sections);
}

/**
 * Format date/time for display
 */
function formatEventTime(time: {
  date?: string;
  dateTime?: string;
  timeZone?: string;
}): string {
  if (time.date) {
    return `📅 ${time.date} (All day)`;
  }
  if (time.dateTime) {
    const tz = time.timeZone ? ` (${time.timeZone})` : "";
    return `🕐 ${time.dateTime}${tz}`;
  }
  return "Not set";
}

/**
 * Calendar event data structure
 */
interface EventData {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  status?: string;
  html_link?: string;
  hangout_link?: string;
  attendees?: {
    email: string;
    display_name?: string;
    response_status?: string;
    optional?: boolean;
  }[];
  creator?: {
    email: string;
    display_name?: string;
  };
  organizer?: {
    email: string;
    display_name?: string;
  };
  recurrence?: string[];
  recurring_event_id?: string;
  created?: string;
  updated?: string;
}

/**
 * Event list result structure
 */
interface EventListData {
  calendar_id: string;
  count: number;
  events: EventData[];
}

/**
 * Build event details array
 */
function buildEventDetails(event: EventData): string[] {
  const details: string[] = [
    `**Event ID:** ${event.id}`,
    `**Start:** ${formatEventTime(event.start)}`,
    `**End:** ${formatEventTime(event.end)}`,
  ];

  if (event.location) {
    details.push(`**Location:** ${event.location}`);
  }
  if (event.status) {
    details.push(`**Status:** ${event.status}`);
  }
  if (event.hangout_link) {
    details.push(`**Google Meet:** ${event.hangout_link}`);
  }
  if (event.html_link) {
    details.push(`**View in Calendar:** ${event.html_link}`);
  }

  return details;
}

/**
 * Format attendee for display
 */
function formatAttendee(
  att: NonNullable<EventData["attendees"]>[number]
): string {
  const name = att.display_name || att.email;
  const status = att.response_status ? ` (${att.response_status})` : "";
  const optional = att.optional ? " [Optional]" : "";
  return `${name}${status}${optional}`;
}

/**
 * Add event summary to sections
 */
function addEventSummary(
  sections: json2md.DataObject[],
  event: EventData
): void {
  sections.push({ h2: event.summary });
  sections.push({ ul: buildEventDetails(event) });

  if (event.description) {
    sections.push({ p: `**Description:** ${event.description}` });
  }

  if (event.attendees && event.attendees.length > 0) {
    sections.push({ h3: "Attendees" });
    sections.push({ ul: event.attendees.map(formatAttendee) });
  }

  if (event.recurrence && event.recurrence.length > 0) {
    sections.push({ p: `**Recurrence:** ${event.recurrence.join(", ")}` });
  }
}

/**
 * Convert event list to markdown
 */
export function eventListToMarkdown(data: EventListData): string {
  const sections: json2md.DataObject[] = [
    { h1: "Calendar Events" },
    {
      p: `**Calendar:** ${data.calendar_id} | **Events Found:** ${data.count}`,
    },
  ];

  if (data.events.length === 0) {
    sections.push({ p: "No events found matching the criteria." });
  } else {
    for (const event of data.events) {
      addEventSummary(sections, event);
      sections.push({ hr: "" });
    }
  }

  return json2md(sections);
}

/**
 * Format attendee for detailed display
 */
function formatAttendeeDetailed(
  att: NonNullable<EventData["attendees"]>[number]
): string {
  const name = att.display_name || att.email;
  const status = att.response_status ? ` - ${att.response_status}` : "";
  const optional = att.optional ? " [Optional]" : "";
  return `**${name}**${status}${optional}`;
}

/**
 * Add event metadata to sections
 */
function addEventMetadata(
  sections: json2md.DataObject[],
  event: EventData
): void {
  if (event.creator) {
    sections.push({
      p: `**Created by:** ${event.creator.display_name || event.creator.email}`,
    });
  }

  if (event.organizer) {
    sections.push({
      p: `**Organized by:** ${event.organizer.display_name || event.organizer.email}`,
    });
  }

  if (event.recurrence && event.recurrence.length > 0) {
    sections.push({ h2: "Recurrence" });
    sections.push({ ul: event.recurrence });
  }

  if (event.created || event.updated) {
    const metadata: string[] = [];
    if (event.created) {
      metadata.push(`**Created:** ${event.created}`);
    }
    if (event.updated) {
      metadata.push(`**Last Updated:** ${event.updated}`);
    }
    sections.push({ p: metadata.join(" | ") });
  }
}

/**
 * Convert single event to markdown
 */
export function eventToMarkdown(
  event: EventData,
  successMessage?: string
): string {
  const sections: json2md.DataObject[] = [];

  sections.push({ h1: successMessage || "Calendar Event" });
  sections.push({ h2: event.summary });
  sections.push({ ul: buildEventDetails(event) });

  if (event.description) {
    sections.push({ h2: "Description" });
    sections.push({ p: event.description });
  }

  if (event.attendees && event.attendees.length > 0) {
    sections.push({ h2: "Attendees" });
    sections.push({ ul: event.attendees.map(formatAttendeeDetailed) });
  }

  addEventMetadata(sections, event);

  return json2md(sections);
}

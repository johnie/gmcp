/**
 * Tests for markdown formatting utilities
 */

import { describe, expect, it } from "vitest";
import {
  attachmentsToMarkdown,
  batchModificationToMarkdown,
  calendarListToMarkdown,
  draftCreatedToMarkdown,
  emailPreviewToMarkdown,
  emailSentToMarkdown,
  emailToMarkdown,
  eventListToMarkdown,
  eventToMarkdown,
  labelModificationToMarkdown,
  replyPreviewToMarkdown,
  replySentToMarkdown,
  searchResultsToMarkdown,
  threadToMarkdown,
} from "@/utils/markdown.ts";

describe("searchResultsToMarkdown", () => {
  it("generates header with query and count", () => {
    const data = {
      total_estimate: 5,
      count: 2,
      has_more: false,
      emails: [],
    };
    const result = searchResultsToMarkdown("test query", data);

    expect(result).toContain('Gmail Search Results: "test query"');
    expect(result).toContain("Found approximately 5 emails (showing 2)");
  });

  it("shows no results message for empty results", () => {
    const data = {
      total_estimate: 0,
      count: 0,
      has_more: false,
      emails: [],
    };
    const result = searchResultsToMarkdown("no match", data);

    expect(result).toContain("No emails found matching the query");
  });

  it("displays single email", () => {
    const data = {
      total_estimate: 1,
      count: 1,
      has_more: false,
      emails: [
        {
          id: "msg123",
          thread_id: "thread456",
          subject: "Test Subject",
          from: "sender@example.com",
          to: "recipient@example.com",
          date: "2024-01-01",
          snippet: "Test snippet",
        },
      ],
    };
    const result = searchResultsToMarkdown("test", data);

    expect(result).toContain("Test Subject");
    expect(result).toContain("sender@example.com");
    expect(result).toContain("Test snippet");
  });

  it("displays multiple emails", () => {
    const data = {
      total_estimate: 2,
      count: 2,
      has_more: false,
      emails: [
        {
          id: "msg1",
          thread_id: "thread1",
          subject: "First Email",
          from: "sender1@example.com",
          to: "recipient@example.com",
          date: "2024-01-01",
          snippet: "First snippet",
        },
        {
          id: "msg2",
          thread_id: "thread2",
          subject: "Second Email",
          from: "sender2@example.com",
          to: "recipient@example.com",
          date: "2024-01-02",
          snippet: "Second snippet",
        },
      ],
    };
    const result = searchResultsToMarkdown("test", data);

    expect(result).toContain("First Email");
    expect(result).toContain("Second Email");
  });

  it("shows pagination token when has_more is true", () => {
    const data = {
      total_estimate: 100,
      count: 10,
      has_more: true,
      next_page_token: "token123",
      emails: [
        {
          id: "msg1",
          thread_id: "thread1",
          subject: "Email",
          from: "sender@example.com",
          to: "recipient@example.com",
          date: "2024-01-01",
          snippet: "snippet",
        },
      ],
    };
    const result = searchResultsToMarkdown("test", data);

    expect(result).toContain("More results available");
    expect(result).toContain("token123");
  });
});

describe("emailToMarkdown", () => {
  it("formats email with all fields", () => {
    const email = {
      id: "msg123",
      thread_id: "thread456",
      subject: "Test Subject",
      from: "sender@example.com",
      to: "recipient@example.com",
      date: "2024-01-01",
      snippet: "Test snippet",
      body: "Full body content",
      labels: ["INBOX", "UNREAD"],
    };
    const result = emailToMarkdown(email);

    expect(result).toContain("Test Subject");
    expect(result).toContain("sender@example.com");
    expect(result).toContain("recipient@example.com");
    expect(result).toContain("msg123");
    expect(result).toContain("INBOX, UNREAD");
    expect(result).toContain("Full body content");
  });

  it("shows snippet when body is absent", () => {
    const email = {
      id: "msg123",
      thread_id: "thread456",
      subject: "Test Subject",
      from: "sender@example.com",
      to: "recipient@example.com",
      date: "2024-01-01",
      snippet: "Test snippet only",
    };
    const result = emailToMarkdown(email);

    expect(result).toContain("Snippet");
    expect(result).toContain("Test snippet only");
    expect(result).not.toContain("Body");
  });

  it("omits labels section when no labels present", () => {
    const email = {
      id: "msg123",
      thread_id: "thread456",
      subject: "Test Subject",
      from: "sender@example.com",
      to: "recipient@example.com",
      date: "2024-01-01",
      snippet: "Test snippet",
    };
    const result = emailToMarkdown(email);

    expect(result).toContain("Test Subject");
    expect(result).not.toContain("**Labels:**");
  });
});

describe("threadToMarkdown", () => {
  it("shows subject from first message and message count", () => {
    const messages = [
      {
        id: "msg1",
        thread_id: "thread123",
        subject: "Thread Subject",
        from: "sender@example.com",
        to: "recipient@example.com",
        date: "2024-01-01",
        snippet: "First message",
      },
      {
        id: "msg2",
        thread_id: "thread123",
        subject: "Re: Thread Subject",
        from: "recipient@example.com",
        to: "sender@example.com",
        date: "2024-01-02",
        snippet: "Reply message",
      },
    ];
    const result = threadToMarkdown("thread123", messages);

    expect(result).toContain("Thread: Thread Subject");
    expect(result).toContain("Thread ID:** thread123");
    expect(result).toContain("Messages:** 2");
  });

  it("numbers messages sequentially", () => {
    const messages = [
      {
        id: "msg1",
        thread_id: "thread123",
        subject: "Subject",
        from: "sender1@example.com",
        to: "recipient@example.com",
        date: "2024-01-01",
        snippet: "Message 1",
      },
      {
        id: "msg2",
        thread_id: "thread123",
        subject: "Re: Subject",
        from: "sender2@example.com",
        to: "recipient@example.com",
        date: "2024-01-02",
        snippet: "Message 2",
      },
    ];
    const result = threadToMarkdown("thread123", messages);

    expect(result).toContain("Message 1");
    expect(result).toContain("Message 2");
  });

  it("handles empty message array", () => {
    const result = threadToMarkdown("thread123", []);

    expect(result).toContain("Thread: Conversation");
    expect(result).toContain("Messages:** 0");
  });
});

describe("labelModificationToMarkdown", () => {
  it("shows added and removed labels", () => {
    const email = {
      id: "msg123",
      thread_id: "thread456",
      subject: "Test Subject",
      from: "sender@example.com",
      to: "recipient@example.com",
      date: "2024-01-01",
      snippet: "snippet",
      labels: ["INBOX", "STARRED"],
    };
    const result = labelModificationToMarkdown(email, ["STARRED"], ["UNREAD"]);

    expect(result).toContain("Label Modification Successful");
    expect(result).toContain("Added Labels");
    expect(result).toContain("STARRED");
    expect(result).toContain("Removed Labels");
    expect(result).toContain("UNREAD");
    expect(result).toContain("Current Labels");
    expect(result).toContain("INBOX, STARRED");
  });

  it("shows message when no current labels", () => {
    const email = {
      id: "msg123",
      thread_id: "thread456",
      subject: "Test Subject",
      from: "sender@example.com",
      to: "recipient@example.com",
      date: "2024-01-01",
      snippet: "snippet",
      labels: [],
    };
    const result = labelModificationToMarkdown(email);

    expect(result).toContain("*No labels on this message*");
  });

  it("handles undefined labels gracefully", () => {
    const email = {
      id: "msg123",
      thread_id: "thread456",
      subject: "Test Subject",
      from: "sender@example.com",
      to: "recipient@example.com",
      date: "2024-01-01",
      snippet: "snippet",
    };
    const result = labelModificationToMarkdown(email);

    expect(result).toContain("*No labels on this message*");
  });
});

describe("batchModificationToMarkdown", () => {
  it("shows message count and label lists", () => {
    const result = batchModificationToMarkdown(
      5,
      ["STARRED", "IMPORTANT"],
      ["UNREAD"]
    );

    expect(result).toContain("Batch Label Modification Successful");
    expect(result).toContain("Modified Messages:** 5");
    expect(result).toContain("Added Labels");
    expect(result).toContain("STARRED");
    expect(result).toContain("IMPORTANT");
    expect(result).toContain("Removed Labels");
    expect(result).toContain("UNREAD");
    expect(result).toContain("All 5 messages have been updated successfully");
  });

  it("handles only added labels", () => {
    const result = batchModificationToMarkdown(3, ["STARRED"]);

    expect(result).toContain("Modified Messages:** 3");
    expect(result).toContain("Added Labels");
    expect(result).toContain("STARRED");
    expect(result).not.toContain("Removed Labels");
  });

  it("handles only removed labels", () => {
    const result = batchModificationToMarkdown(2, undefined, ["UNREAD"]);

    expect(result).toContain("Modified Messages:** 2");
    expect(result).not.toContain("Added Labels");
    expect(result).toContain("Removed Labels");
    expect(result).toContain("UNREAD");
  });
});

describe("attachmentsToMarkdown", () => {
  it("shows message for empty attachment list", () => {
    const result = attachmentsToMarkdown("msg123", []);

    expect(result).toContain("Email Attachments");
    expect(result).toContain("Message ID:** msg123");
    expect(result).toContain("Total Attachments:** 0");
    expect(result).toContain("*No attachments found in this email.*");
  });

  it("formats attachment details", () => {
    const attachments = [
      {
        filename: "document.pdf",
        mimeType: "application/pdf",
        size: 1024,
        attachmentId: "att123",
      },
    ];
    const result = attachmentsToMarkdown("msg123", attachments);

    expect(result).toContain("1. document.pdf");
    expect(result).toContain("application/pdf");
    expect(result).toContain("1 KB");
    expect(result).toContain("att123");
  });

  it("formats bytes correctly", () => {
    const attachments = [
      {
        filename: "zero.txt",
        mimeType: "text/plain",
        size: 0,
        attachmentId: "a1",
      },
      {
        filename: "bytes.txt",
        mimeType: "text/plain",
        size: 512,
        attachmentId: "a2",
      },
      {
        filename: "kb.txt",
        mimeType: "text/plain",
        size: 1024,
        attachmentId: "a3",
      },
      {
        filename: "mb.txt",
        mimeType: "text/plain",
        size: 1_048_576,
        attachmentId: "a4",
      },
    ];
    const result = attachmentsToMarkdown("msg123", attachments);

    expect(result).toContain("0 B");
    expect(result).toContain("512 B");
    expect(result).toContain("1 KB");
    expect(result).toContain("1 MB");
  });
});

describe("emailPreviewToMarkdown", () => {
  it("shows NOT SENT warning and all fields", () => {
    const params = {
      to: "recipient@example.com",
      subject: "Test Subject",
      body: "Email body content",
      content_type: "text/plain",
      cc: "cc@example.com",
      bcc: "bcc@example.com",
    };
    const result = emailPreviewToMarkdown(params);

    expect(result).toContain("Email Preview - NOT SENT");
    expect(result).toContain("⚠️");
    expect(result).toContain("This email has not been sent yet");
    expect(result).toContain("confirm: true");
    expect(result).toContain("recipient@example.com");
    expect(result).toContain("Test Subject");
    expect(result).toContain("cc@example.com");
    expect(result).toContain("bcc@example.com");
    expect(result).toContain("text/plain");
    expect(result).toContain("Email body content");
  });

  it("omits CC/BCC when not provided", () => {
    const params = {
      to: "recipient@example.com",
      subject: "Test Subject",
      body: "Body",
      content_type: "text/plain",
    };
    const result = emailPreviewToMarkdown(params);

    expect(result).toContain("To:** recipient@example.com");
    expect(result).not.toContain("**CC:**");
    expect(result).not.toContain("**BCC:**");
  });
});

describe("emailSentToMarkdown", () => {
  it("shows success indicator and all IDs", () => {
    const params = {
      to: "recipient@example.com",
      subject: "Test Subject",
      cc: "cc@example.com",
      bcc: "bcc@example.com",
    };
    const result = { id: "msg123", threadId: "thread456" };
    const markdown = emailSentToMarkdown(params, result);

    expect(markdown).toContain("✅ Email Sent Successfully");
    expect(markdown).toContain("recipient@example.com");
    expect(markdown).toContain("Test Subject");
    expect(markdown).toContain("cc@example.com");
    expect(markdown).toContain("bcc@example.com");
    expect(markdown).toContain("msg123");
    expect(markdown).toContain("thread456");
    expect(markdown).toContain("Sent folder");
  });

  it("omits CC/BCC when not provided", () => {
    const params = {
      to: "recipient@example.com",
      subject: "Test Subject",
    };
    const result = { id: "msg123", threadId: "thread456" };
    const markdown = emailSentToMarkdown(params, result);

    expect(markdown).not.toContain("**CC:**");
    expect(markdown).not.toContain("**BCC:**");
  });
});

describe("replyPreviewToMarkdown", () => {
  it("shows original message details and reply details", () => {
    const originalEmail = {
      subject: "Original Subject",
      from: "sender@example.com",
      to: "me@example.com",
      date: "2024-01-01",
    };
    const result = replyPreviewToMarkdown(
      originalEmail,
      "Reply body",
      "text/plain",
      "cc@example.com"
    );

    expect(result).toContain("Reply Preview - NOT SENT");
    expect(result).toContain("⚠️");
    expect(result).toContain("Original Message");
    expect(result).toContain("sender@example.com");
    expect(result).toContain("Original Subject");
    expect(result).toContain("Your Reply");
    expect(result).toContain("To:** sender@example.com");
    expect(result).toContain("Re: Original Subject");
    expect(result).toContain("cc@example.com");
    expect(result).toContain("text/plain");
    expect(result).toContain("Reply body");
  });

  it("omits CC when not provided", () => {
    const originalEmail = {
      subject: "Subject",
      from: "sender@example.com",
      to: "me@example.com",
      date: "2024-01-01",
    };
    const result = replyPreviewToMarkdown(
      originalEmail,
      "Reply body",
      "text/plain"
    );

    expect(result).not.toContain("**CC:**");
  });
});

describe("replySentToMarkdown", () => {
  it("shows success message and reply details", () => {
    const originalEmail = {
      subject: "Original Subject",
      from: "sender@example.com",
    };
    const result = { id: "msg789", threadId: "thread012" };
    const markdown = replySentToMarkdown(
      originalEmail,
      result,
      "cc@example.com"
    );

    expect(markdown).toContain("✅ Reply Sent Successfully");
    expect(markdown).toContain("To:** sender@example.com");
    expect(markdown).toContain("Re: Original Subject");
    expect(markdown).toContain("cc@example.com");
    expect(markdown).toContain("msg789");
    expect(markdown).toContain("thread012");
    expect(markdown).toContain("conversation thread");
  });

  it("omits CC when not provided", () => {
    const originalEmail = {
      subject: "Subject",
      from: "sender@example.com",
    };
    const result = { id: "msg789", threadId: "thread012" };
    const markdown = replySentToMarkdown(originalEmail, result);

    expect(markdown).not.toContain("**CC:**");
  });
});

describe("draftCreatedToMarkdown", () => {
  it("shows draft details and message IDs", () => {
    const params = {
      to: "recipient@example.com",
      subject: "Draft Subject",
      cc: "cc@example.com",
      bcc: "bcc@example.com",
    };
    const result = {
      id: "draft123",
      message: {
        id: "msg456",
        threadId: "thread789",
      },
    };
    const markdown = draftCreatedToMarkdown(params, result);

    expect(markdown).toContain("✅ Draft Created Successfully");
    expect(markdown).toContain("recipient@example.com");
    expect(markdown).toContain("Draft Subject");
    expect(markdown).toContain("cc@example.com");
    expect(markdown).toContain("bcc@example.com");
    expect(markdown).toContain("draft123");
    expect(markdown).toContain("msg456");
    expect(markdown).toContain("Drafts folder");
  });

  it("omits CC/BCC when not provided", () => {
    const params = {
      to: "recipient@example.com",
      subject: "Draft Subject",
    };
    const result = {
      id: "draft123",
      message: {
        id: "msg456",
        threadId: "thread789",
      },
    };
    const markdown = draftCreatedToMarkdown(params, result);

    expect(markdown).not.toContain("**CC:**");
    expect(markdown).not.toContain("**BCC:**");
  });
});

describe("calendarListToMarkdown", () => {
  it("shows empty calendar list message", () => {
    const data = {
      count: 0,
      calendars: [],
    };
    const result = calendarListToMarkdown(data);

    expect(result).toContain("Google Calendars");
    expect(result).toContain("Total Calendars:** 0");
    expect(result).toContain("No calendars found");
  });

  it("shows calendars with details", () => {
    const data = {
      count: 2,
      calendars: [
        {
          id: "cal1",
          summary: "Work Calendar",
          timezone: "America/New_York",
          access_role: "owner",
        },
        {
          id: "cal2",
          summary: "Personal",
          timezone: "Europe/London",
          access_role: "reader",
          description: "My personal calendar",
        },
      ],
    };
    const result = calendarListToMarkdown(data);

    expect(result).toContain("Work Calendar");
    expect(result).toContain("Personal");
    expect(result).toContain("America/New_York");
    expect(result).toContain("owner");
    expect(result).toContain("My personal calendar");
  });

  it("shows primary calendar indicator", () => {
    const data = {
      count: 1,
      calendars: [
        {
          id: "primary",
          summary: "Main Calendar",
          primary: true,
          timezone: "UTC",
          access_role: "owner",
        },
      ],
    };
    const result = calendarListToMarkdown(data);

    expect(result).toContain("Primary:** Yes");
  });
});

describe("eventListToMarkdown", () => {
  it("shows empty events message", () => {
    const data = {
      calendar_id: "primary",
      count: 0,
      events: [],
    };
    const result = eventListToMarkdown(data);

    expect(result).toContain("Calendar Events");
    expect(result).toContain("Calendar:** primary");
    expect(result).toContain("No events found");
  });

  it("shows events with details", () => {
    const data = {
      calendar_id: "primary",
      count: 1,
      events: [
        {
          id: "event1",
          summary: "Team Meeting",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          status: "confirmed",
        },
      ],
    };
    const result = eventListToMarkdown(data);

    expect(result).toContain("Team Meeting");
    expect(result).toContain("event1");
    expect(result).toContain("confirmed");
  });

  it("shows events with attendees", () => {
    const data = {
      calendar_id: "primary",
      count: 1,
      events: [
        {
          id: "event1",
          summary: "Meeting",
          start: { dateTime: "2024-01-15T10:00:00Z" },
          end: { dateTime: "2024-01-15T11:00:00Z" },
          attendees: [
            { email: "user1@example.com", response_status: "accepted" },
            {
              email: "user2@example.com",
              display_name: "User Two",
              optional: true,
            },
          ],
        },
      ],
    };
    const result = eventListToMarkdown(data);

    expect(result).toContain("Attendees");
    expect(result).toContain("user1@example.com");
    expect(result).toContain("accepted");
    expect(result).toContain("User Two");
    expect(result).toContain("[Optional]");
  });
});

describe("eventToMarkdown", () => {
  it("shows event with success message", () => {
    const event = {
      id: "event123",
      summary: "Created Event",
      start: { dateTime: "2024-01-15T10:00:00Z" },
      end: { dateTime: "2024-01-15T11:00:00Z" },
    };
    const result = eventToMarkdown(event, "Event Created Successfully");

    expect(result).toContain("Event Created Successfully");
    expect(result).toContain("Created Event");
  });

  it("shows event without success message", () => {
    const event = {
      id: "event123",
      summary: "Regular Event",
      start: { dateTime: "2024-01-15T10:00:00Z" },
      end: { dateTime: "2024-01-15T11:00:00Z" },
    };
    const result = eventToMarkdown(event);

    expect(result).toContain("Calendar Event");
    expect(result).toContain("Regular Event");
  });

  it("shows event with description", () => {
    const event = {
      id: "event123",
      summary: "Documented Event",
      description: "This is a detailed description of the event.",
      start: { dateTime: "2024-01-15T10:00:00Z" },
      end: { dateTime: "2024-01-15T11:00:00Z" },
    };
    const result = eventToMarkdown(event);

    expect(result).toContain("Description");
    expect(result).toContain("This is a detailed description");
  });

  it("shows event with attendees", () => {
    const event = {
      id: "event123",
      summary: "Team Event",
      start: { dateTime: "2024-01-15T10:00:00Z" },
      end: { dateTime: "2024-01-15T11:00:00Z" },
      attendees: [{ email: "user@example.com", response_status: "tentative" }],
    };
    const result = eventToMarkdown(event);

    expect(result).toContain("Attendees");
    expect(result).toContain("user@example.com");
    expect(result).toContain("tentative");
  });

  it("shows event with recurrence", () => {
    const event = {
      id: "event123",
      summary: "Recurring Event",
      start: { dateTime: "2024-01-15T10:00:00Z" },
      end: { dateTime: "2024-01-15T11:00:00Z" },
      recurrence: ["RRULE:FREQ=WEEKLY;COUNT=10"],
    };
    const result = eventToMarkdown(event);

    expect(result).toContain("Recurrence");
    expect(result).toContain("RRULE:FREQ=WEEKLY");
  });

  it("shows event with metadata (creator, organizer, timestamps)", () => {
    const event = {
      id: "event123",
      summary: "Full Event",
      start: { dateTime: "2024-01-15T10:00:00Z" },
      end: { dateTime: "2024-01-15T11:00:00Z" },
      creator: { email: "creator@example.com", display_name: "Creator Name" },
      organizer: { email: "organizer@example.com" },
      created: "2024-01-01T00:00:00Z",
      updated: "2024-01-14T12:00:00Z",
    };
    const result = eventToMarkdown(event);

    expect(result).toContain("Created by");
    expect(result).toContain("Creator Name");
    expect(result).toContain("Organized by");
    expect(result).toContain("organizer@example.com");
    expect(result).toContain("Created");
    expect(result).toContain("Last Updated");
  });

  it("shows all-day event format", () => {
    const event = {
      id: "event123",
      summary: "All Day Event",
      start: { date: "2024-01-15" },
      end: { date: "2024-01-16" },
    };
    const result = eventToMarkdown(event);

    expect(result).toContain("2024-01-15");
    expect(result).toContain("All day");
  });

  it("shows event with Google Meet link", () => {
    const event = {
      id: "event123",
      summary: "Video Meeting",
      start: { dateTime: "2024-01-15T10:00:00Z" },
      end: { dateTime: "2024-01-15T11:00:00Z" },
      hangout_link: "https://meet.google.com/abc-defg-hij",
    };
    const result = eventToMarkdown(event);

    expect(result).toContain("Google Meet");
    expect(result).toContain("https://meet.google.com/abc-defg-hij");
  });
});

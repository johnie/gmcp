/**
 * Mock GmailClient for testing
 */

import { vi } from "vitest";
import type { GmailClient } from "@/gmail.ts";
import type {
  AttachmentInfo,
  DraftResult,
  EmailMessage,
  GmailLabel,
  GmailSearchResult,
  SendResult,
} from "@/types.ts";

export function createMockGmailClient(
  overrides: Partial<GmailClient> = {}
): GmailClient {
  const defaultEmailMessage: EmailMessage = {
    id: "msg123",
    threadId: "thread456",
    subject: "Test Subject",
    from: "sender@example.com",
    to: "recipient@example.com",
    date: "Mon, 01 Jan 2024 12:00:00 +0000",
    snippet: "Test snippet",
    body: "Test body content",
    labels: ["INBOX", "UNREAD"],
  };

  const defaultSearchResult: GmailSearchResult = {
    emails: [defaultEmailMessage],
    total_estimate: 1,
    has_more: false,
  };

  const defaultLabel: GmailLabel = {
    id: "Label_123",
    name: "TestLabel",
    type: "user",
    messageListVisibility: "show",
    labelListVisibility: "labelShow",
    messagesTotal: 10,
    messagesUnread: 5,
  };

  const defaultSendResult: SendResult = {
    id: "msg789",
    threadId: "thread012",
  };

  const defaultDraftResult: DraftResult = {
    id: "draft456",
    message: {
      id: "msg789",
      threadId: "thread012",
    },
  };

  const defaultAttachmentInfo: AttachmentInfo = {
    filename: "test.pdf",
    mimeType: "application/pdf",
    size: 1024,
    attachmentId: "attachment123",
  };

  return {
    searchEmails: vi.fn().mockResolvedValue(defaultSearchResult),
    getMessage: vi.fn().mockResolvedValue(defaultEmailMessage),
    getThread: vi.fn().mockResolvedValue([defaultEmailMessage]),
    listAttachments: vi.fn().mockResolvedValue([defaultAttachmentInfo]),
    getAttachment: vi.fn().mockResolvedValue("base64encodeddata"),
    modifyLabels: vi.fn().mockResolvedValue(defaultEmailMessage),
    batchModifyLabels: vi.fn().mockResolvedValue(undefined),
    sendEmail: vi.fn().mockResolvedValue(defaultSendResult),
    replyToEmail: vi.fn().mockResolvedValue(defaultSendResult),
    createDraft: vi.fn().mockResolvedValue(defaultDraftResult),
    listLabels: vi.fn().mockResolvedValue([defaultLabel]),
    getLabel: vi.fn().mockResolvedValue(defaultLabel),
    createLabel: vi.fn().mockResolvedValue(defaultLabel),
    updateLabel: vi.fn().mockResolvedValue(defaultLabel),
    deleteLabel: vi.fn().mockResolvedValue(undefined),
    deleteEmail: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

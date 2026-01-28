/**
 * Gmail message fixtures for MSW handlers
 * Using googleapis types for type safety
 */

import type { gmail_v1 } from "googleapis";

const BASE64_PLUS_REGEX = /\+/g;
const BASE64_SLASH_REGEX = /\//g;
const BASE64_PADDING_REGEX = /=+$/;

/**
 * Base64url encode a string
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(BASE64_PLUS_REGEX, "-")
    .replace(BASE64_SLASH_REGEX, "_")
    .replace(BASE64_PADDING_REGEX, "");
}

/**
 * Simple text/plain message
 */
export const simpleTextMessage: gmail_v1.Schema$Message = {
  id: "msg_simple_001",
  threadId: "thread_001",
  labelIds: ["INBOX", "UNREAD"],
  snippet: "This is a simple test email body",
  payload: {
    mimeType: "text/plain",
    headers: [
      { name: "From", value: "sender@example.com" },
      { name: "To", value: "recipient@example.com" },
      { name: "Subject", value: "Simple Test Email" },
      { name: "Date", value: "Mon, 15 Jan 2024 10:00:00 +0000" },
    ],
    body: {
      data: base64UrlEncode("This is a simple test email body"),
    },
  },
};

/**
 * Multipart message with text/plain and text/html parts
 */
export const multipartMessage: gmail_v1.Schema$Message = {
  id: "msg_multipart_002",
  threadId: "thread_002",
  labelIds: ["INBOX"],
  snippet: "Plain text version of the email",
  payload: {
    mimeType: "multipart/alternative",
    headers: [
      { name: "From", value: "newsletter@example.com" },
      { name: "To", value: "user@example.com" },
      { name: "Subject", value: "Multipart Newsletter" },
      { name: "Date", value: "Tue, 16 Jan 2024 14:30:00 +0000" },
    ],
    parts: [
      {
        mimeType: "text/plain",
        body: {
          data: base64UrlEncode("Plain text version of the email"),
        },
      },
      {
        mimeType: "text/html",
        body: {
          data: base64UrlEncode(
            "<html><body><h1>HTML Newsletter</h1><p>Rich content</p></body></html>"
          ),
        },
      },
    ],
  },
};

/**
 * HTML-only message (no text/plain part)
 */
export const htmlOnlyMessage: gmail_v1.Schema$Message = {
  id: "msg_html_003",
  threadId: "thread_003",
  labelIds: ["INBOX", "IMPORTANT"],
  snippet: "HTML content preview...",
  payload: {
    mimeType: "multipart/alternative",
    headers: [
      { name: "From", value: "marketing@example.com" },
      { name: "To", value: "subscriber@example.com" },
      { name: "Subject", value: "HTML Only Email" },
      { name: "Date", value: "Wed, 17 Jan 2024 09:15:00 +0000" },
    ],
    parts: [
      {
        mimeType: "text/html",
        body: {
          data: base64UrlEncode(
            "<html><body><h1>Important Announcement</h1><p>This is <strong>HTML</strong> content.</p></body></html>"
          ),
        },
      },
    ],
  },
};

/**
 * Message with nested multipart structure
 */
export const nestedMultipartMessage: gmail_v1.Schema$Message = {
  id: "msg_nested_004",
  threadId: "thread_004",
  labelIds: ["INBOX"],
  snippet: "Deeply nested plain text",
  payload: {
    mimeType: "multipart/mixed",
    headers: [
      { name: "From", value: "complex@example.com" },
      { name: "To", value: "deep@example.com" },
      { name: "Subject", value: "Nested Structure Email" },
      { name: "Date", value: "Thu, 18 Jan 2024 11:45:00 +0000" },
    ],
    parts: [
      {
        mimeType: "multipart/alternative",
        parts: [
          {
            mimeType: "text/plain",
            body: {
              data: base64UrlEncode("Deeply nested plain text"),
            },
          },
          {
            mimeType: "text/html",
            body: {
              data: base64UrlEncode("<p>Deeply nested HTML</p>"),
            },
          },
        ],
      },
    ],
  },
};

/**
 * Message with attachment
 */
export const messageWithAttachment: gmail_v1.Schema$Message = {
  id: "msg_attach_005",
  threadId: "thread_005",
  labelIds: ["INBOX"],
  snippet: "Please find the attached document",
  payload: {
    mimeType: "multipart/mixed",
    headers: [
      { name: "From", value: "documents@example.com" },
      { name: "To", value: "recipient@example.com" },
      { name: "Subject", value: "Document Attached" },
      { name: "Date", value: "Fri, 19 Jan 2024 16:00:00 +0000" },
    ],
    parts: [
      {
        mimeType: "text/plain",
        body: {
          data: base64UrlEncode("Please find the attached document"),
        },
      },
      {
        filename: "report.pdf",
        mimeType: "application/pdf",
        body: {
          attachmentId: "attachment_001",
          size: 12_345,
        },
      },
      {
        filename: "spreadsheet.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: {
          attachmentId: "attachment_002",
          size: 8765,
        },
      },
    ],
  },
};

/**
 * Message with missing headers
 */
export const messageWithMissingHeaders: gmail_v1.Schema$Message = {
  id: "msg_missing_006",
  threadId: "thread_006",
  labelIds: ["INBOX"],
  snippet: "Body content",
  payload: {
    mimeType: "text/plain",
    headers: [
      // Missing From, To, Subject, Date headers
    ],
    body: {
      data: base64UrlEncode("Body content"),
    },
  },
};

/**
 * Message with empty body
 */
export const messageWithEmptyBody: gmail_v1.Schema$Message = {
  id: "msg_empty_007",
  threadId: "thread_007",
  labelIds: ["INBOX"],
  snippet: "",
  payload: {
    mimeType: "text/plain",
    headers: [
      { name: "From", value: "empty@example.com" },
      { name: "To", value: "recipient@example.com" },
      { name: "Subject", value: "Empty Body Email" },
      { name: "Date", value: "Sat, 20 Jan 2024 08:00:00 +0000" },
    ],
    body: {},
  },
};

/**
 * Minimal message for list responses (metadata only)
 */
export const minimalMessageRef: gmail_v1.Schema$Message = {
  id: "msg_minimal_008",
  threadId: "thread_008",
};

/**
 * Get all fixture messages as a map by ID
 */
export const messageFixtures: Map<string, gmail_v1.Schema$Message> = new Map([
  ["msg_simple_001", simpleTextMessage],
  ["msg_multipart_002", multipartMessage],
  ["msg_html_003", htmlOnlyMessage],
  ["msg_nested_004", nestedMultipartMessage],
  ["msg_attach_005", messageWithAttachment],
  ["msg_missing_006", messageWithMissingHeaders],
  ["msg_empty_007", messageWithEmptyBody],
  ["msg_minimal_008", minimalMessageRef],
]);

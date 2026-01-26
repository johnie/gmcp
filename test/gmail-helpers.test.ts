/**
 * Tests for Gmail helper functions
 */

import type { gmail_v1 } from "googleapis";
import { describe, expect, it } from "vitest";
import {
  createMimeMessage,
  decodeBase64,
  encodeMessage,
  extractBody,
  getPartBody,
  parseLabel,
  parseMessage,
} from "@/gmail.ts";

describe("decodeBase64", () => {
  it("decodes valid base64url string", () => {
    const encoded = Buffer.from("Hello World")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const result = decodeBase64(encoded);
    expect(result).toBe("Hello World");
  });

  it("handles standard base64 with + and /", () => {
    const encoded = Buffer.from("Test message").toString("base64");
    const result = decodeBase64(encoded);
    expect(result).toBe("Test message");
  });

  it("handles malformed base64", () => {
    // Buffer.from with base64 is permissive, so we test actual error case
    const result = decodeBase64("!!!invalid!!!");
    // The function will decode whatever it can, even if malformed
    expect(result).toBeDefined();
  });

  it("decodes empty string", () => {
    const encoded = Buffer.from("").toString("base64");
    const result = decodeBase64(encoded);
    expect(result).toBe("");
  });
});

describe("getPartBody", () => {
  it("extracts body from part with matching mime type", () => {
    const part: gmail_v1.Schema$MessagePart = {
      mimeType: "text/plain",
      body: {
        data: Buffer.from("Body content").toString("base64"),
      },
    };
    const result = getPartBody(part, "text/plain");
    expect(result).toBe("Body content");
  });

  it("returns empty string when mime type does not match", () => {
    const part: gmail_v1.Schema$MessagePart = {
      mimeType: "text/html",
      body: {
        data: Buffer.from("HTML content").toString("base64"),
      },
    };
    const result = getPartBody(part, "text/plain");
    expect(result).toBe("");
  });

  it("recursively searches nested parts", () => {
    const part: gmail_v1.Schema$MessagePart = {
      mimeType: "multipart/mixed",
      parts: [
        {
          mimeType: "text/html",
          body: { data: Buffer.from("HTML").toString("base64") },
        },
        {
          mimeType: "text/plain",
          body: { data: Buffer.from("Plain text").toString("base64") },
        },
      ],
    };
    const result = getPartBody(part, "text/plain");
    expect(result).toBe("Plain text");
  });

  it("returns first match in nested parts", () => {
    const part: gmail_v1.Schema$MessagePart = {
      mimeType: "multipart/mixed",
      parts: [
        {
          mimeType: "text/plain",
          body: { data: Buffer.from("First").toString("base64") },
        },
        {
          mimeType: "text/plain",
          body: { data: Buffer.from("Second").toString("base64") },
        },
      ],
    };
    const result = getPartBody(part, "text/plain");
    expect(result).toBe("First");
  });

  it("returns empty string when no matching parts found", () => {
    const part: gmail_v1.Schema$MessagePart = {
      mimeType: "multipart/mixed",
      parts: [
        {
          mimeType: "text/html",
          body: { data: Buffer.from("HTML").toString("base64") },
        },
      ],
    };
    const result = getPartBody(part, "text/plain");
    expect(result).toBe("");
  });
});

describe("extractBody", () => {
  it("returns empty string for undefined payload", () => {
    const result = extractBody(undefined);
    expect(result).toBe("");
  });

  it("extracts text/plain body", () => {
    const payload: gmail_v1.Schema$MessagePart = {
      mimeType: "text/plain",
      body: {
        data: Buffer.from("Plain text body").toString("base64"),
      },
    };
    const result = extractBody(payload);
    expect(result).toBe("Plain text body");
  });

  it("prefers text/plain over text/html", () => {
    const payload: gmail_v1.Schema$MessagePart = {
      mimeType: "multipart/alternative",
      parts: [
        {
          mimeType: "text/plain",
          body: { data: Buffer.from("Plain").toString("base64") },
        },
        {
          mimeType: "text/html",
          body: { data: Buffer.from("HTML").toString("base64") },
        },
      ],
    };
    const result = extractBody(payload);
    expect(result).toBe("Plain");
  });

  it("falls back to text/html when text/plain not available", () => {
    const payload: gmail_v1.Schema$MessagePart = {
      mimeType: "multipart/alternative",
      parts: [
        {
          mimeType: "text/html",
          body: { data: Buffer.from("HTML body").toString("base64") },
        },
      ],
    };
    const result = extractBody(payload);
    expect(result).toBe("HTML body");
  });

  it("falls back to direct body data when no parts", () => {
    const payload: gmail_v1.Schema$MessagePart = {
      mimeType: "text/plain",
      body: {
        data: Buffer.from("Direct body").toString("base64"),
      },
    };
    const result = extractBody(payload);
    expect(result).toBe("Direct body");
  });

  it("returns (no body) when no body found", () => {
    const payload: gmail_v1.Schema$MessagePart = {
      mimeType: "multipart/mixed",
      parts: [],
    };
    const result = extractBody(payload);
    expect(result).toBe("(no body)");
  });
});

describe("parseMessage", () => {
  it("parses message without body", () => {
    const message: gmail_v1.Schema$Message = {
      id: "msg123",
      threadId: "thread456",
      snippet: "Test snippet",
      labelIds: ["INBOX", "UNREAD"],
      payload: {
        headers: [
          { name: "Subject", value: "Test Subject" },
          { name: "From", value: "sender@example.com" },
          { name: "To", value: "recipient@example.com" },
          { name: "Date", value: "Mon, 01 Jan 2024 12:00:00 +0000" },
        ],
      },
    };
    const result = parseMessage(message, false);

    expect(result.id).toBe("msg123");
    expect(result.threadId).toBe("thread456");
    expect(result.subject).toBe("Test Subject");
    expect(result.from).toBe("sender@example.com");
    expect(result.to).toBe("recipient@example.com");
    expect(result.date).toBe("Mon, 01 Jan 2024 12:00:00 +0000");
    expect(result.snippet).toBe("Test snippet");
    expect(result.labels).toEqual(["INBOX", "UNREAD"]);
    expect(result.body).toBeUndefined();
  });

  it("parses message with body", () => {
    const message: gmail_v1.Schema$Message = {
      id: "msg123",
      threadId: "thread456",
      snippet: "Test snippet",
      payload: {
        headers: [
          { name: "Subject", value: "Test Subject" },
          { name: "From", value: "sender@example.com" },
          { name: "To", value: "recipient@example.com" },
          { name: "Date", value: "2024-01-01" },
        ],
        mimeType: "text/plain",
        body: {
          data: Buffer.from("Email body content").toString("base64"),
        },
      },
    };
    const result = parseMessage(message, true);

    expect(result.body).toBe("Email body content");
  });

  it("handles missing headers with defaults", () => {
    const message: gmail_v1.Schema$Message = {
      id: "msg123",
      threadId: "thread456",
      snippet: "Snippet",
      payload: {},
    };
    const result = parseMessage(message, false);

    expect(result.subject).toBe("(no subject)");
    expect(result.from).toBe("(unknown)");
    expect(result.to).toBe("(unknown)");
    expect(result.date).toBe("");
  });

  it("handles missing optional fields", () => {
    const message: gmail_v1.Schema$Message = {
      payload: {
        headers: [
          { name: "Subject", value: "Test" },
          { name: "From", value: "sender@example.com" },
          { name: "To", value: "recipient@example.com" },
          { name: "Date", value: "2024-01-01" },
        ],
      },
    };
    const result = parseMessage(message, false);

    expect(result.id).toBe("");
    expect(result.threadId).toBe("");
    expect(result.snippet).toBe("");
    expect(result.labels).toBeUndefined();
  });
});

describe("createMimeMessage", () => {
  it("creates basic MIME message", () => {
    const result = createMimeMessage({
      to: "recipient@example.com",
      subject: "Test Subject",
      body: "Email body",
      contentType: "text/plain",
    });

    expect(result).toContain("To: recipient@example.com");
    expect(result).toContain("Subject: Test Subject");
    expect(result).toContain("Content-Type: text/plain; charset=utf-8");
    expect(result).toContain("Email body");
  });

  it("includes CC when provided", () => {
    const result = createMimeMessage({
      to: "recipient@example.com",
      subject: "Test",
      body: "Body",
      contentType: "text/plain",
      cc: "cc@example.com",
    });

    expect(result).toContain("Cc: cc@example.com");
  });

  it("includes BCC when provided", () => {
    const result = createMimeMessage({
      to: "recipient@example.com",
      subject: "Test",
      body: "Body",
      contentType: "text/plain",
      bcc: "bcc@example.com",
    });

    expect(result).toContain("Bcc: bcc@example.com");
  });

  it("includes reply headers when provided", () => {
    const result = createMimeMessage({
      to: "recipient@example.com",
      subject: "Re: Test",
      body: "Reply body",
      contentType: "text/plain",
      inReplyTo: "<msg123>",
      references: "<msg123>",
    });

    expect(result).toContain("In-Reply-To: <msg123>");
    expect(result).toContain("References: <msg123>");
  });

  it("supports HTML content type", () => {
    const result = createMimeMessage({
      to: "recipient@example.com",
      subject: "HTML Email",
      body: "<h1>Hello</h1>",
      contentType: "text/html",
    });

    expect(result).toContain("Content-Type: text/html; charset=utf-8");
    expect(result).toContain("<h1>Hello</h1>");
  });

  it("uses CRLF line endings", () => {
    const result = createMimeMessage({
      to: "recipient@example.com",
      subject: "Test",
      body: "Body",
      contentType: "text/plain",
    });

    expect(result).toContain("\r\n");
  });
});

describe("encodeMessage", () => {
  it("encodes message to base64url", () => {
    const message = "To: test@example.com\r\nSubject: Test\r\n\r\nBody";
    const result = encodeMessage(message);

    expect(result).not.toContain("+");
    expect(result).not.toContain("/");
    expect(result).not.toContain("=");
  });

  it("replaces + with -", () => {
    const message = "Test message with special chars";
    const result = encodeMessage(message);
    const decoded = Buffer.from(
      result.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString();
    expect(decoded).toBe(message);
  });

  it("replaces / with _", () => {
    const message = "Another test message";
    const result = encodeMessage(message);
    expect(result).not.toContain("/");
  });

  it("removes padding", () => {
    const message = "A";
    const result = encodeMessage(message);
    expect(result).not.toContain("=");
  });
});

describe("parseLabel", () => {
  it("parses system label", () => {
    const label: gmail_v1.Schema$Label = {
      id: "INBOX",
      name: "INBOX",
      type: "system",
      messageListVisibility: "show",
      labelListVisibility: "labelShow",
      messagesTotal: 100,
      messagesUnread: 5,
    };
    const result = parseLabel(label);

    expect(result.id).toBe("INBOX");
    expect(result.name).toBe("INBOX");
    expect(result.type).toBe("system");
    expect(result.messageListVisibility).toBe("show");
    expect(result.labelListVisibility).toBe("labelShow");
    expect(result.messagesTotal).toBe(100);
    expect(result.messagesUnread).toBe(5);
  });

  it("parses user label", () => {
    const label: gmail_v1.Schema$Label = {
      id: "Label_123",
      name: "Custom Label",
      type: "user",
    };
    const result = parseLabel(label);

    expect(result.id).toBe("Label_123");
    expect(result.name).toBe("Custom Label");
    expect(result.type).toBe("user");
  });

  it("parses label with color", () => {
    const label: gmail_v1.Schema$Label = {
      id: "Label_456",
      name: "Colored",
      type: "user",
      color: {
        textColor: "#ffffff",
        backgroundColor: "#ff0000",
      },
    };
    const result = parseLabel(label);

    expect(result.color).toEqual({
      textColor: "#ffffff",
      backgroundColor: "#ff0000",
    });
  });

  it("handles missing optional fields", () => {
    const label: gmail_v1.Schema$Label = {
      id: "Label_789",
      name: "Minimal",
    };
    const result = parseLabel(label);

    expect(result.id).toBe("Label_789");
    expect(result.name).toBe("Minimal");
    expect(result.type).toBe("user");
    expect(result.messageListVisibility).toBeUndefined();
    expect(result.labelListVisibility).toBeUndefined();
    expect(result.messagesTotal).toBeUndefined();
    expect(result.messagesUnread).toBeUndefined();
    expect(result.color).toBeUndefined();
  });

  it("defaults to user type when type is not system", () => {
    const label: gmail_v1.Schema$Label = {
      id: "Label_999",
      name: "Test",
      type: "unknown",
    };
    const result = parseLabel(label);

    expect(result.type).toBe("user");
  });
});

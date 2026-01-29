/**
 * Gmail pipeline integration tests
 * Tests full HTTP response → client parsing → output flow using MSW
 */

import { describe, expect, it } from "vitest";
import { createGmailClient } from "@/gmail.ts";
import { createMockOAuth2Client } from "../helpers/auth.ts";
import {
  mockGmailError,
  mockGmailRateLimited,
  mockGmailUnauthorized,
} from "../msw/utils.ts";

describe("Gmail Pipeline Integration", () => {
  const auth = createMockOAuth2Client();
  const client = createGmailClient(auth);

  describe("searchEmails", () => {
    it("should search and parse emails correctly", async () => {
      const result = await client.searchEmails("test", 5);

      expect(result.emails).toBeDefined();
      expect(result.total_estimate).toBeGreaterThan(0);
      expect(typeof result.has_more).toBe("boolean");
    });

    it("should parse simple text/plain message", async () => {
      const result = await client.getMessage("msg_simple_001", true);

      expect(result.id).toBe("msg_simple_001");
      expect(result.threadId).toBe("thread_001");
      expect(result.subject).toBe("Simple Test Email");
      expect(result.from).toBe("sender@example.com");
      expect(result.to).toBe("recipient@example.com");
      expect(result.date).toBe("Mon, 15 Jan 2024 10:00:00 +0000");
      expect(result.body).toBe("This is a simple test email body");
      expect(result.labels).toContain("INBOX");
      expect(result.labels).toContain("UNREAD");
    });

    it("should parse multipart message with text/plain priority", async () => {
      const result = await client.getMessage("msg_multipart_002", true);

      expect(result.id).toBe("msg_multipart_002");
      expect(result.subject).toBe("Multipart Newsletter");
      // Should extract text/plain over text/html
      expect(result.body).toBe("Plain text version of the email");
    });

    it("should fall back to text/html when no text/plain", async () => {
      const result = await client.getMessage("msg_html_003", true);

      expect(result.id).toBe("msg_html_003");
      expect(result.subject).toBe("HTML Only Email");
      // Should fall back to HTML content
      expect(result.body).toContain("<html>");
      expect(result.body).toContain("Important Announcement");
    });

    it("should parse deeply nested multipart structure", async () => {
      const result = await client.getMessage("msg_nested_004", true);

      expect(result.id).toBe("msg_nested_004");
      expect(result.body).toBe("Deeply nested plain text");
    });

    it("should handle missing headers gracefully", async () => {
      const result = await client.getMessage("msg_missing_006", true);

      expect(result.id).toBe("msg_missing_006");
      expect(result.subject).toBe("(no subject)");
      expect(result.from).toBe("(unknown)");
      expect(result.to).toBe("(unknown)");
      expect(result.date).toBe("");
    });

    it("should handle empty body gracefully", async () => {
      const result = await client.getMessage("msg_empty_007", true);

      expect(result.id).toBe("msg_empty_007");
      expect(result.body).toBe("(no body)");
    });

    it("should return metadata only when includeBody is false", async () => {
      const result = await client.getMessage("msg_simple_001", false);

      expect(result.id).toBe("msg_simple_001");
      expect(result.subject).toBe("Simple Test Email");
      expect(result.body).toBeUndefined();
    });
  });

  describe("getThread", () => {
    it("should get thread with single message", async () => {
      const messages = await client.getThread("thread_001", true);

      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe("msg_simple_001");
      expect(messages[0].body).toBe("This is a simple test email body");
    });

    it("should get thread with conversation", async () => {
      const messages = await client.getThread("thread_conversation", true);

      expect(messages).toHaveLength(3);
      expect(messages[0].from).toBe("alice@example.com");
      expect(messages[1].from).toBe("bob@example.com");
      expect(messages[2].from).toBe("alice@example.com");
      expect(messages[0].body).toContain("available for a meeting");
      expect(messages[1].body).toContain("free at 2pm");
      expect(messages[2].body).toContain("calendar invite");
    });
  });

  describe("listAttachments", () => {
    it("should list attachments from message", async () => {
      const attachments = await client.listAttachments("msg_attach_005");

      expect(attachments).toHaveLength(2);
      expect(attachments[0]).toEqual({
        filename: "report.pdf",
        mimeType: "application/pdf",
        size: 12_345,
        attachmentId: "attachment_001",
      });
      expect(attachments[1]).toEqual({
        filename: "spreadsheet.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 8765,
        attachmentId: "attachment_002",
      });
    });

    it("should return empty array for message without attachments", async () => {
      const attachments = await client.listAttachments("msg_simple_001");

      expect(attachments).toHaveLength(0);
    });
  });

  describe("getAttachment", () => {
    it("should get attachment data", async () => {
      const data = await client.getAttachment(
        "msg_attach_005",
        "attachment_001"
      );

      expect(data).toBeDefined();
      expect(typeof data).toBe("string");
    });
  });

  describe("modifyLabels", () => {
    it("should add and remove labels", async () => {
      const result = await client.modifyLabels(
        "msg_simple_001",
        ["IMPORTANT"],
        ["UNREAD"]
      );

      expect(result.id).toBe("msg_simple_001");
      expect(result.labels).toContain("INBOX");
      expect(result.labels).toContain("IMPORTANT");
      expect(result.labels).not.toContain("UNREAD");
    });
  });

  describe("batchModifyLabels", () => {
    it("should batch modify labels successfully", async () => {
      // Should not throw
      await expect(
        client.batchModifyLabels(
          ["msg_simple_001", "msg_multipart_002"],
          ["STARRED"],
          ["UNREAD"]
        )
      ).resolves.toBeUndefined();
    });
  });

  describe("sendEmail", () => {
    it("should send email and return result", async () => {
      const result = await client.sendEmail(
        "recipient@example.com",
        "Test Subject",
        "Test body content"
      );

      expect(result.id).toBeDefined();
      expect(result.threadId).toBeDefined();
    });

    it("should send HTML email", async () => {
      const result = await client.sendEmail(
        "recipient@example.com",
        "HTML Email",
        "<h1>Hello</h1>",
        "text/html"
      );

      expect(result.id).toBeDefined();
    });
  });

  describe("replyToEmail", () => {
    it("should reply to email in thread", async () => {
      const result = await client.replyToEmail(
        "original@example.com",
        "Original Subject",
        "Reply body",
        "thread_001",
        "msg_simple_001"
      );

      expect(result.id).toBeDefined();
      expect(result.threadId).toBe("thread_001");
    });
  });

  describe("createDraft", () => {
    it("should create draft", async () => {
      const result = await client.createDraft(
        "recipient@example.com",
        "Draft Subject",
        "Draft body"
      );

      expect(result.id).toBeDefined();
      expect(result.message.id).toBeDefined();
      expect(result.message.threadId).toBeDefined();
    });
  });

  describe("labels", () => {
    it("should list all labels", async () => {
      const labels = await client.listLabels();

      expect(labels.length).toBeGreaterThan(0);
      const inbox = labels.find((l) => l.id === "INBOX");
      expect(inbox).toBeDefined();
      expect(inbox?.name).toBe("INBOX");
      expect(inbox?.type).toBe("system");
    });

    it("should get single label", async () => {
      const label = await client.getLabel("Label_1");

      expect(label.id).toBe("Label_1");
      expect(label.name).toBe("Work");
      expect(label.type).toBe("user");
      expect(label.color?.backgroundColor).toBe("#4285f4");
    });

    it("should create label", async () => {
      const label = await client.createLabel(
        "New Label",
        "show",
        "labelShow",
        "#ff0000",
        "#ffffff"
      );

      expect(label.id).toBeDefined();
      expect(label.name).toBe("New Label");
      expect(label.type).toBe("user");
    });

    it("should update label", async () => {
      const label = await client.updateLabel(
        "Label_1",
        "Updated Work",
        "hide",
        "labelHide"
      );

      expect(label.id).toBe("Label_1");
      expect(label.name).toBe("Updated Work");
    });

    it("should delete label", async () => {
      await expect(client.deleteLabel("Label_1")).resolves.toBeUndefined();
    });
  });

  describe("deleteEmail", () => {
    it("should delete email", async () => {
      await expect(
        client.deleteEmail("msg_simple_001")
      ).resolves.toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should handle 404 for non-existent message", async () => {
      await expect(client.getMessage("nonexistent", true)).rejects.toThrow(
        "Failed to get message nonexistent"
      );
    });

    it("should handle 404 for non-existent thread", async () => {
      await expect(client.getThread("nonexistent", true)).rejects.toThrow(
        "Failed to get thread nonexistent"
      );
    });

    it("should handle 404 for non-existent label", async () => {
      await expect(client.getLabel("nonexistent")).rejects.toThrow(
        "Failed to get label nonexistent"
      );
    });

    it("should handle 401 unauthorized", async () => {
      mockGmailUnauthorized();

      await expect(client.searchEmails("test")).rejects.toThrow();
    });

    it("should handle 429 rate limit", async () => {
      mockGmailRateLimited();

      await expect(client.searchEmails("test")).rejects.toThrow();
    });

    it("should handle custom error on specific endpoint", async () => {
      mockGmailError("get", "/messages/custom_error", 500, "Server error");

      await expect(client.getMessage("custom_error", true)).rejects.toThrow();
    });
  });
});

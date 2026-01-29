/**
 * Tests for tool handlers
 */

import { describe, expect, it, vi } from "vitest";
import { archiveEmailTool } from "@/tools/archive-email.ts";
import { batchModifyTool } from "@/tools/batch-modify.ts";
import { createDraftTool } from "@/tools/create-draft.ts";
import { createLabelTool } from "@/tools/create-label.ts";
import { deleteEmailTool } from "@/tools/delete-email.ts";
import { deleteLabelTool } from "@/tools/delete-label.ts";
import { getAttachmentTool } from "@/tools/get-attachment.ts";
import { getEmailTool } from "@/tools/get-email.ts";
import { getLabelTool } from "@/tools/get-label.ts";
import { getThreadTool } from "@/tools/get-thread.ts";
import { listAttachmentsTool } from "@/tools/list-attachments.ts";
import { listLabelsTool } from "@/tools/list-labels.ts";
import { modifyLabelsTool } from "@/tools/modify-labels.ts";
import { replyTool } from "@/tools/reply.ts";
import { searchEmailsTool } from "@/tools/search.ts";
import { sendEmailTool } from "@/tools/send-email.ts";
import { updateLabelTool } from "@/tools/update-label.ts";
import { createMockGmailClient } from "../mocks/gmail-client.ts";

describe("searchEmailsTool", () => {
  it("calls gmailClient.searchEmails with correct params", async () => {
    const client = createMockGmailClient();
    await searchEmailsTool(client, {
      query: "from:test@example.com",
      max_results: 20,
      include_body: true,
      page_token: "token123",
      output_format: "markdown",
    });

    expect(client.searchEmails).toHaveBeenCalledWith(
      "from:test@example.com",
      20,
      true,
      "token123"
    );
  });

  it("returns markdown format by default", async () => {
    const client = createMockGmailClient();
    const result = await searchEmailsTool(client, {
      query: "test",
      max_results: 10,
      include_body: false,
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Gmail Search Results");
    }
  });

  it("returns JSON format when requested", async () => {
    const client = createMockGmailClient();
    const result = await searchEmailsTool(client, {
      query: "test",
      max_results: 10,
      include_body: false,
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("emails");
      expect(parsed).toHaveProperty("total_estimate");
    }
  });

  it("includes structured content in response", async () => {
    const client = createMockGmailClient();
    const result = await searchEmailsTool(client, {
      query: "test",
      max_results: 10,
      include_body: false,
      output_format: "markdown",
    });

    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent?.emails).toBeDefined();
    expect(result.structuredContent?.total_estimate).toBeDefined();
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      searchEmails: vi.fn().mockRejectedValue(new Error("API Error")),
    });
    const result = await searchEmailsTool(client, {
      query: "test",
      max_results: 10,
      include_body: false,
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

describe("getEmailTool", () => {
  it("calls gmailClient.getMessage with correct params", async () => {
    const client = createMockGmailClient();
    await getEmailTool(client, {
      message_id: "msg123",
      include_body: true,
      output_format: "markdown",
    });

    expect(client.getMessage).toHaveBeenCalledWith("msg123", true);
  });

  it("returns markdown format by default", async () => {
    const client = createMockGmailClient();
    const result = await getEmailTool(client, {
      message_id: "msg123",
      include_body: true,
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Test Subject");
    }
  });

  it("returns JSON format when requested", async () => {
    const client = createMockGmailClient();
    const result = await getEmailTool(client, {
      message_id: "msg123",
      include_body: true,
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("id");
      expect(parsed).toHaveProperty("subject");
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      getMessage: vi.fn().mockRejectedValue(new Error("Not found")),
    });
    const result = await getEmailTool(client, {
      message_id: "invalid",
      include_body: true,
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

describe("sendEmailTool", () => {
  it("does not call sendEmail in preview mode", async () => {
    const client = createMockGmailClient();
    await sendEmailTool(client, {
      to: "test@example.com",
      subject: "Test",
      body: "Body",
      content_type: "text/plain",
      confirm: false,
      output_format: "markdown",
    });

    expect(client.sendEmail).not.toHaveBeenCalled();
  });

  it("calls gmailClient.sendEmail when confirm is true", async () => {
    const client = createMockGmailClient();
    await sendEmailTool(client, {
      to: "test@example.com",
      subject: "Test Subject",
      body: "Email body",
      content_type: "text/html",
      cc: "cc@example.com",
      bcc: "bcc@example.com",
      confirm: true,
      output_format: "markdown",
    });

    expect(client.sendEmail).toHaveBeenCalledWith(
      "test@example.com",
      "Test Subject",
      "Email body",
      "text/html",
      "cc@example.com",
      "bcc@example.com"
    );
  });

  it("returns preview in markdown format", async () => {
    const client = createMockGmailClient();
    const result = await sendEmailTool(client, {
      to: "test@example.com",
      subject: "Test",
      body: "Body",
      content_type: "text/plain",
      confirm: false,
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Email Preview - NOT SENT");
      expect(result.content[0].text).toContain("confirm: true");
    }
  });

  it("returns sent confirmation in markdown format", async () => {
    const client = createMockGmailClient();
    const result = await sendEmailTool(client, {
      to: "test@example.com",
      subject: "Test",
      body: "Body",
      content_type: "text/plain",
      confirm: true,
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Email Sent Successfully");
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      sendEmail: vi.fn().mockRejectedValue(new Error("Send failed")),
    });
    const result = await sendEmailTool(client, {
      to: "test@example.com",
      subject: "Test",
      body: "Body",
      content_type: "text/plain",
      confirm: true,
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

describe("deleteLabelTool", () => {
  it("calls gmailClient.deleteLabel with correct label_id", async () => {
    const client = createMockGmailClient();
    await deleteLabelTool(client, {
      label_id: "Label_123",
      output_format: "markdown",
    });

    expect(client.deleteLabel).toHaveBeenCalledWith("Label_123");
  });

  it("returns success message in markdown format", async () => {
    const client = createMockGmailClient();
    const result = await deleteLabelTool(client, {
      label_id: "Label_123",
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Label Deleted Successfully");
    }
  });

  it("returns JSON format when requested", async () => {
    const client = createMockGmailClient();
    const result = await deleteLabelTool(client, {
      label_id: "Label_123",
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("label_id", "Label_123");
      expect(parsed).toHaveProperty("deleted", true);
    }
  });

  it("includes structured content in response", async () => {
    const client = createMockGmailClient();
    const result = await deleteLabelTool(client, {
      label_id: "Label_123",
      output_format: "markdown",
    });

    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent?.label_id).toBe("Label_123");
    expect(result.structuredContent?.deleted).toBe(true);
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      deleteLabel: vi.fn().mockRejectedValue(new Error("Delete failed")),
    });
    const result = await deleteLabelTool(client, {
      label_id: "Label_123",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

describe("archiveEmailTool", () => {
  it("calls modifyLabels to remove INBOX label", async () => {
    const client = createMockGmailClient();
    await archiveEmailTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect(client.modifyLabels).toHaveBeenCalledWith("msg123", undefined, [
      "INBOX",
    ]);
  });

  it("returns success message in markdown format", async () => {
    const client = createMockGmailClient();
    const result = await archiveEmailTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Email Archived Successfully");
    }
  });

  it("returns JSON format when requested", async () => {
    const client = createMockGmailClient();
    const result = await archiveEmailTool(client, {
      message_id: "msg123",
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("archived", true);
      expect(parsed).toHaveProperty("removed_labels", ["INBOX"]);
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      modifyLabels: vi.fn().mockRejectedValue(new Error("Archive failed")),
    });
    const result = await archiveEmailTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

describe("replyTool", () => {
  it("returns preview when confirm is false", async () => {
    const client = createMockGmailClient();
    const result = await replyTool(client, {
      message_id: "msg123",
      body: "Thanks for your email!",
      content_type: "text/plain",
      confirm: false,
      output_format: "markdown",
    });

    expect(client.replyToEmail).not.toHaveBeenCalled();
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Reply Preview - NOT SENT");
    }
  });

  it("sends reply when confirm is true", async () => {
    const client = createMockGmailClient();
    const result = await replyTool(client, {
      message_id: "msg123",
      body: "Thanks!",
      content_type: "text/plain",
      confirm: true,
      output_format: "markdown",
    });

    expect(client.replyToEmail).toHaveBeenCalled();
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Reply Sent Successfully");
    }
  });

  it("includes CC in reply when provided", async () => {
    const client = createMockGmailClient();
    await replyTool(client, {
      message_id: "msg123",
      body: "Noted",
      content_type: "text/plain",
      cc: "cc@example.com",
      confirm: true,
      output_format: "markdown",
    });

    expect(client.replyToEmail).toHaveBeenCalledWith(
      "sender@example.com",
      "Test Subject",
      "Noted",
      "thread456",
      "msg123",
      "text/plain",
      "cc@example.com"
    );
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      getMessage: vi.fn().mockRejectedValue(new Error("Not found")),
    });
    const result = await replyTool(client, {
      message_id: "invalid",
      body: "Reply",
      content_type: "text/plain",
      confirm: true,
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("modifyLabelsTool", () => {
  it("adds labels only", async () => {
    const client = createMockGmailClient();
    const result = await modifyLabelsTool(client, {
      message_id: "msg123",
      add_labels: ["STARRED"],
      output_format: "markdown",
    });

    expect(client.modifyLabels).toHaveBeenCalledWith(
      "msg123",
      ["STARRED"],
      undefined
    );
    expect(result.content[0]?.type).toBe("text");
  });

  it("removes labels only", async () => {
    const client = createMockGmailClient();
    await modifyLabelsTool(client, {
      message_id: "msg123",
      remove_labels: ["UNREAD"],
      output_format: "markdown",
    });

    expect(client.modifyLabels).toHaveBeenCalledWith("msg123", undefined, [
      "UNREAD",
    ]);
  });

  it("adds and removes labels together", async () => {
    const client = createMockGmailClient();
    await modifyLabelsTool(client, {
      message_id: "msg123",
      add_labels: ["STARRED"],
      remove_labels: ["UNREAD"],
      output_format: "markdown",
    });

    expect(client.modifyLabels).toHaveBeenCalledWith(
      "msg123",
      ["STARRED"],
      ["UNREAD"]
    );
  });

  it("returns error when no labels specified", async () => {
    const client = createMockGmailClient();
    const result = await modifyLabelsTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("add_labels or remove_labels");
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      modifyLabels: vi.fn().mockRejectedValue(new Error("Modify failed")),
    });
    const result = await modifyLabelsTool(client, {
      message_id: "msg123",
      add_labels: ["STARRED"],
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("getThreadTool", () => {
  it("returns thread in markdown format", async () => {
    const client = createMockGmailClient();
    const result = await getThreadTool(client, {
      thread_id: "thread456",
      include_body: false,
      output_format: "markdown",
    });

    expect(client.getThread).toHaveBeenCalledWith("thread456", false);
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Thread");
    }
  });

  it("returns thread in JSON format", async () => {
    const client = createMockGmailClient();
    const result = await getThreadTool(client, {
      thread_id: "thread456",
      include_body: false,
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("thread_id", "thread456");
      expect(parsed).toHaveProperty("messages");
    }
  });

  it("includes body when requested", async () => {
    const client = createMockGmailClient({
      getThread: vi.fn().mockResolvedValue([
        {
          id: "msg1",
          threadId: "thread456",
          subject: "Test",
          from: "sender@example.com",
          to: "recipient@example.com",
          date: "2024-01-01",
          snippet: "Test snippet",
          body: "Full email body content here",
          labels: ["INBOX"],
        },
      ]),
    });
    const result = await getThreadTool(client, {
      thread_id: "thread456",
      include_body: true,
      output_format: "markdown",
    });

    expect(client.getThread).toHaveBeenCalledWith("thread456", true);
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Body");
    }
  });

  it("shows labels in thread messages", async () => {
    const client = createMockGmailClient({
      getThread: vi.fn().mockResolvedValue([
        {
          id: "msg1",
          threadId: "thread456",
          subject: "Test",
          from: "sender@example.com",
          to: "recipient@example.com",
          date: "2024-01-01",
          snippet: "Test snippet",
          labels: ["INBOX", "STARRED"],
        },
      ]),
    });
    const result = await getThreadTool(client, {
      thread_id: "thread456",
      include_body: false,
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Labels");
    }
  });

  it("handles multiple messages in thread", async () => {
    const client = createMockGmailClient({
      getThread: vi.fn().mockResolvedValue([
        {
          id: "msg1",
          threadId: "thread456",
          subject: "Test",
          from: "sender@example.com",
          to: "recipient@example.com",
          date: "2024-01-01",
          snippet: "First message",
        },
        {
          id: "msg2",
          threadId: "thread456",
          subject: "Re: Test",
          from: "recipient@example.com",
          to: "sender@example.com",
          date: "2024-01-02",
          snippet: "Second message",
        },
      ]),
    });
    const result = await getThreadTool(client, {
      thread_id: "thread456",
      include_body: false,
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Message 1");
      expect(result.content[0].text).toContain("Message 2");
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      getThread: vi.fn().mockRejectedValue(new Error("Thread not found")),
    });
    const result = await getThreadTool(client, {
      thread_id: "invalid",
      include_body: false,
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("listAttachmentsTool", () => {
  it("returns empty attachments list", async () => {
    const client = createMockGmailClient({
      listAttachments: vi.fn().mockResolvedValue([]),
    });
    const result = await listAttachmentsTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("No attachments");
    }
  });

  it("returns attachments with details", async () => {
    const client = createMockGmailClient();
    const result = await listAttachmentsTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("test.pdf");
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      listAttachments: vi.fn().mockRejectedValue(new Error("Failed")),
    });
    const result = await listAttachmentsTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("getAttachmentTool", () => {
  it("returns attachment data in base64 format", async () => {
    const client = createMockGmailClient();
    const result = await getAttachmentTool(client, {
      message_id: "msg123",
      attachment_id: "att123",
      output_format: "base64",
    });

    expect(client.getAttachment).toHaveBeenCalledWith("msg123", "att123");
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toBe("base64encodeddata");
    }
  });

  it("returns attachment data in JSON format", async () => {
    const client = createMockGmailClient();
    const result = await getAttachmentTool(client, {
      message_id: "msg123",
      attachment_id: "att123",
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("data", "base64encodeddata");
      expect(parsed).toHaveProperty("encoding", "base64url");
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      getAttachment: vi.fn().mockRejectedValue(new Error("Not found")),
    });
    const result = await getAttachmentTool(client, {
      message_id: "msg123",
      attachment_id: "invalid",
      output_format: "base64",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("batchModifyTool", () => {
  it("calls batchModifyLabels with correct params", async () => {
    const client = createMockGmailClient();
    await batchModifyTool(client, {
      message_ids: ["msg1", "msg2", "msg3"],
      add_labels: ["STARRED"],
      remove_labels: ["UNREAD"],
      output_format: "markdown",
    });

    expect(client.batchModifyLabels).toHaveBeenCalledWith(
      ["msg1", "msg2", "msg3"],
      ["STARRED"],
      ["UNREAD"]
    );
  });

  it("returns success message", async () => {
    const client = createMockGmailClient();
    const result = await batchModifyTool(client, {
      message_ids: ["msg1", "msg2"],
      add_labels: ["STARRED"],
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Batch Label Modification");
    }
  });

  it("returns error when no labels specified", async () => {
    const client = createMockGmailClient();
    const result = await batchModifyTool(client, {
      message_ids: ["msg1"],
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      batchModifyLabels: vi.fn().mockRejectedValue(new Error("Batch failed")),
    });
    const result = await batchModifyTool(client, {
      message_ids: ["msg1"],
      add_labels: ["STARRED"],
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("createDraftTool", () => {
  it("creates draft and returns success", async () => {
    const client = createMockGmailClient();
    const result = await createDraftTool(client, {
      to: "recipient@example.com",
      subject: "Draft Subject",
      body: "Draft body",
      content_type: "text/plain",
      output_format: "markdown",
    });

    expect(client.createDraft).toHaveBeenCalledWith(
      "recipient@example.com",
      "Draft Subject",
      "Draft body",
      "text/plain",
      undefined,
      undefined
    );
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Draft Created Successfully");
    }
  });

  it("includes cc and bcc when provided", async () => {
    const client = createMockGmailClient();
    await createDraftTool(client, {
      to: "recipient@example.com",
      subject: "Draft",
      body: "Body",
      content_type: "text/plain",
      cc: "cc@example.com",
      bcc: "bcc@example.com",
      output_format: "markdown",
    });

    expect(client.createDraft).toHaveBeenCalledWith(
      "recipient@example.com",
      "Draft",
      "Body",
      "text/plain",
      "cc@example.com",
      "bcc@example.com"
    );
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      createDraft: vi.fn().mockRejectedValue(new Error("Draft failed")),
    });
    const result = await createDraftTool(client, {
      to: "recipient@example.com",
      subject: "Draft",
      body: "Body",
      content_type: "text/plain",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("listLabelsTool", () => {
  it("returns labels in markdown format", async () => {
    const client = createMockGmailClient();
    const result = await listLabelsTool(client, {
      output_format: "markdown",
    });

    expect(client.listLabels).toHaveBeenCalled();
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Gmail Labels");
    }
  });

  it("returns labels in JSON format", async () => {
    const client = createMockGmailClient();
    const result = await listLabelsTool(client, {
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("total_count");
      expect(parsed).toHaveProperty("system");
      expect(parsed).toHaveProperty("user");
    }
  });

  it("shows system labels section when present", async () => {
    const client = createMockGmailClient({
      listLabels: vi.fn().mockResolvedValue([
        {
          id: "INBOX",
          name: "INBOX",
          type: "system",
          messagesTotal: 100,
          messagesUnread: 5,
        },
        {
          id: "SENT",
          name: "SENT",
          type: "system",
          messagesTotal: 50,
          messagesUnread: 0,
        },
      ]),
    });
    const result = await listLabelsTool(client, {
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("System Labels");
      expect(result.content[0].text).toContain("INBOX");
    }
  });

  it("shows user labels section when present", async () => {
    const client = createMockGmailClient({
      listLabels: vi.fn().mockResolvedValue([
        {
          id: "Label_1",
          name: "Work",
          type: "user",
          messagesTotal: 20,
          messagesUnread: 2,
        },
      ]),
    });
    const result = await listLabelsTool(client, {
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Custom Labels");
      expect(result.content[0].text).toContain("Work");
    }
  });

  it("shows no labels message when empty", async () => {
    const client = createMockGmailClient({
      listLabels: vi.fn().mockResolvedValue([]),
    });
    const result = await listLabelsTool(client, {
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("No labels found");
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      listLabels: vi.fn().mockRejectedValue(new Error("Failed")),
    });
    const result = await listLabelsTool(client, {
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("getLabelTool", () => {
  it("returns label in markdown format", async () => {
    const client = createMockGmailClient();
    const result = await getLabelTool(client, {
      label_id: "Label_123",
      output_format: "markdown",
    });

    expect(client.getLabel).toHaveBeenCalledWith("Label_123");
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Label:");
    }
  });

  it("returns label in JSON format", async () => {
    const client = createMockGmailClient();
    const result = await getLabelTool(client, {
      label_id: "Label_123",
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("id", "Label_123");
      expect(parsed).toHaveProperty("name");
    }
  });

  it("shows visibility settings when present", async () => {
    const client = createMockGmailClient({
      getLabel: vi.fn().mockResolvedValue({
        id: "Label_123",
        name: "TestLabel",
        type: "user",
        messageListVisibility: "show",
        labelListVisibility: "labelShow",
      }),
    });
    const result = await getLabelTool(client, {
      label_id: "Label_123",
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Visibility");
    }
  });

  it("shows color settings when present", async () => {
    const client = createMockGmailClient({
      getLabel: vi.fn().mockResolvedValue({
        id: "Label_123",
        name: "ColoredLabel",
        type: "user",
        color: { textColor: "#ffffff", backgroundColor: "#ff0000" },
      }),
    });
    const result = await getLabelTool(client, {
      label_id: "Label_123",
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Color");
      expect(result.content[0].text).toContain("#ffffff");
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      getLabel: vi.fn().mockRejectedValue(new Error("Not found")),
    });
    const result = await getLabelTool(client, {
      label_id: "invalid",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("createLabelTool", () => {
  it("creates label without colors", async () => {
    const client = createMockGmailClient();
    const result = await createLabelTool(client, {
      name: "NewLabel",
      output_format: "markdown",
    });

    expect(client.createLabel).toHaveBeenCalledWith(
      "NewLabel",
      undefined,
      undefined,
      undefined,
      undefined
    );
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Label Created Successfully");
    }
  });

  it("creates label with visibility settings", async () => {
    const client = createMockGmailClient({
      createLabel: vi.fn().mockResolvedValue({
        id: "Label_new",
        name: "HiddenLabel",
        type: "user",
        messageListVisibility: "hide",
        labelListVisibility: "labelHide",
      }),
    });
    const result = await createLabelTool(client, {
      name: "HiddenLabel",
      message_list_visibility: "hide",
      label_list_visibility: "labelHide",
      output_format: "markdown",
    });

    expect(client.createLabel).toHaveBeenCalledWith(
      "HiddenLabel",
      "hide",
      "labelHide",
      undefined,
      undefined
    );
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Visibility");
    }
  });

  it("creates label with colors", async () => {
    const client = createMockGmailClient({
      createLabel: vi.fn().mockResolvedValue({
        id: "Label_colored",
        name: "ColoredLabel",
        type: "user",
        color: { textColor: "#ffffff", backgroundColor: "#ff0000" },
      }),
    });
    const result = await createLabelTool(client, {
      name: "ColoredLabel",
      background_color: "#ff0000",
      text_color: "#ffffff",
      output_format: "markdown",
    });

    expect(client.createLabel).toHaveBeenCalledWith(
      "ColoredLabel",
      undefined,
      undefined,
      "#ff0000",
      "#ffffff"
    );
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Color");
    }
  });

  it("returns error when only background_color provided", async () => {
    const client = createMockGmailClient();
    const result = await createLabelTool(client, {
      name: "Label",
      background_color: "#ff0000",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain(
        "background_color and text_color"
      );
    }
  });

  it("returns error when only text_color provided", async () => {
    const client = createMockGmailClient();
    const result = await createLabelTool(client, {
      name: "Label",
      text_color: "#ffffff",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      createLabel: vi.fn().mockRejectedValue(new Error("Create failed")),
    });
    const result = await createLabelTool(client, {
      name: "NewLabel",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("updateLabelTool", () => {
  it("updates label name", async () => {
    const client = createMockGmailClient();
    const result = await updateLabelTool(client, {
      label_id: "Label_123",
      name: "UpdatedName",
      output_format: "markdown",
    });

    expect(client.updateLabel).toHaveBeenCalledWith(
      "Label_123",
      "UpdatedName",
      undefined,
      undefined,
      undefined,
      undefined
    );
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Label Updated Successfully");
    }
  });

  it("updates visibility settings", async () => {
    const client = createMockGmailClient({
      updateLabel: vi.fn().mockResolvedValue({
        id: "Label_123",
        name: "TestLabel",
        type: "user",
        messageListVisibility: "hide",
        labelListVisibility: "labelHide",
      }),
    });
    const result = await updateLabelTool(client, {
      label_id: "Label_123",
      message_list_visibility: "hide",
      label_list_visibility: "labelHide",
      output_format: "markdown",
    });

    expect(client.updateLabel).toHaveBeenCalledWith(
      "Label_123",
      undefined,
      "hide",
      "labelHide",
      undefined,
      undefined
    );
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Label Updated Successfully");
    }
  });

  it("updates label colors", async () => {
    const client = createMockGmailClient({
      updateLabel: vi.fn().mockResolvedValue({
        id: "Label_123",
        name: "TestLabel",
        type: "user",
        color: { textColor: "#ffffff", backgroundColor: "#0000ff" },
      }),
    });
    const result = await updateLabelTool(client, {
      label_id: "Label_123",
      background_color: "#0000ff",
      text_color: "#ffffff",
      output_format: "markdown",
    });

    expect(client.updateLabel).toHaveBeenCalledWith(
      "Label_123",
      undefined,
      undefined,
      undefined,
      "#0000ff",
      "#ffffff"
    );
    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Color");
    }
  });

  it("returns error when only text_color provided", async () => {
    const client = createMockGmailClient();
    const result = await updateLabelTool(client, {
      label_id: "Label_123",
      text_color: "#ffffff",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain(
        "background_color and text_color"
      );
    }
  });

  it("returns error when trying to rename system label", async () => {
    const client = createMockGmailClient();
    const result = await updateLabelTool(client, {
      label_id: "INBOX",
      name: "RenamedInbox",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Cannot rename system label");
    }
  });

  it("returns error when no update fields provided", async () => {
    const client = createMockGmailClient();
    const result = await updateLabelTool(client, {
      label_id: "Label_123",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("At least one field");
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      updateLabel: vi.fn().mockRejectedValue(new Error("Update failed")),
    });
    const result = await updateLabelTool(client, {
      label_id: "Label_123",
      name: "NewName",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
  });
});

describe("deleteEmailTool", () => {
  it("calls deleteEmail with correct message_id", async () => {
    const client = createMockGmailClient();
    await deleteEmailTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect(client.deleteEmail).toHaveBeenCalledWith("msg123");
  });

  it("returns success message in markdown format", async () => {
    const client = createMockGmailClient();
    const result = await deleteEmailTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Email Deleted Successfully");
    }
  });

  it("returns JSON format when requested", async () => {
    const client = createMockGmailClient();
    const result = await deleteEmailTool(client, {
      message_id: "msg123",
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("deleted", true);
      expect(parsed).toHaveProperty("message_id", "msg123");
    }
  });

  it("handles errors gracefully", async () => {
    const client = createMockGmailClient({
      deleteEmail: vi.fn().mockRejectedValue(new Error("Delete failed")),
    });
    const result = await deleteEmailTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

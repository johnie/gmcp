/**
 * Tests for tool handlers
 */

import { describe, expect, it, vi } from "vitest";
import { deleteLabelTool } from "@/tools/delete-label.ts";
import { getEmailTool } from "@/tools/get-email.ts";
import { searchEmailsTool } from "@/tools/search.ts";
import { sendEmailTool } from "@/tools/send-email.ts";
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

    expect(result.isError).toBe(true);
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

    expect(result.isError).toBe(true);
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

    expect(result.isError).toBe(true);
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

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

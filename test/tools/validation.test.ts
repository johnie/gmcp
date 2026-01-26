/**
 * Tests for tool validation business logic
 */

import { describe, expect, it } from "vitest";
import { batchModifyTool } from "@/tools/batch-modify.ts";
import { createLabelTool } from "@/tools/create-label.ts";
import { deleteLabelTool } from "@/tools/delete-label.ts";
import { modifyLabelsTool } from "@/tools/modify-labels.ts";
import { replyTool } from "@/tools/reply.ts";
import { sendEmailTool } from "@/tools/send-email.ts";
import { createMockGmailClient } from "../mocks/gmail-client.ts";

describe("deleteLabelTool validation", () => {
  it("rejects INBOX system label", async () => {
    const client = createMockGmailClient();
    const result = await deleteLabelTool(client, {
      label_id: "INBOX",
      output_format: "markdown",
    });

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Cannot delete system label");
    }
  });

  it("rejects SENT system label", async () => {
    const client = createMockGmailClient();
    const result = await deleteLabelTool(client, {
      label_id: "SENT",
      output_format: "markdown",
    });

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Cannot delete system label");
    }
  });

  it("rejects STARRED system label", async () => {
    const client = createMockGmailClient();
    const result = await deleteLabelTool(client, {
      label_id: "STARRED",
      output_format: "markdown",
    });

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Cannot delete system label");
    }
  });

  it("rejects CATEGORY_PERSONAL label", async () => {
    const client = createMockGmailClient();
    const result = await deleteLabelTool(client, {
      label_id: "CATEGORY_PERSONAL",
      output_format: "markdown",
    });

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Cannot delete system label");
    }
  });

  it("rejects CATEGORY_SOCIAL label", async () => {
    const client = createMockGmailClient();
    const result = await deleteLabelTool(client, {
      label_id: "CATEGORY_SOCIAL",
      output_format: "markdown",
    });

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Cannot delete system label");
    }
  });

  it("rejects all uppercase labels as system labels", async () => {
    const client = createMockGmailClient();
    const result = await deleteLabelTool(client, {
      label_id: "CUSTOMUPPERCASE",
      output_format: "markdown",
    });

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Cannot delete system label");
    }
  });

  it("allows user label with proper format", async () => {
    const client = createMockGmailClient();
    const result = await deleteLabelTool(client, {
      label_id: "Label_123",
      output_format: "markdown",
    });

    expect(result.isError).not.toBe(true);
  });
});

describe("modifyLabelsTool validation", () => {
  it("returns error when neither add_labels nor remove_labels provided", async () => {
    const client = createMockGmailClient();
    const result = await modifyLabelsTool(client, {
      message_id: "msg123",
      output_format: "markdown",
    });

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain(
        "Must specify at least one of add_labels or remove_labels"
      );
    }
  });

  it("allows only add_labels", async () => {
    const client = createMockGmailClient();
    const result = await modifyLabelsTool(client, {
      message_id: "msg123",
      add_labels: ["STARRED"],
      output_format: "markdown",
    });

    expect(result.isError).not.toBe(true);
  });

  it("allows only remove_labels", async () => {
    const client = createMockGmailClient();
    const result = await modifyLabelsTool(client, {
      message_id: "msg123",
      remove_labels: ["UNREAD"],
      output_format: "markdown",
    });

    expect(result.isError).not.toBe(true);
  });

  it("allows both add_labels and remove_labels", async () => {
    const client = createMockGmailClient();
    const result = await modifyLabelsTool(client, {
      message_id: "msg123",
      add_labels: ["STARRED"],
      remove_labels: ["UNREAD"],
      output_format: "markdown",
    });

    expect(result.isError).not.toBe(true);
  });
});

describe("batchModifyTool validation", () => {
  it("returns error when neither add_labels nor remove_labels provided", async () => {
    const client = createMockGmailClient();
    const result = await batchModifyTool(client, {
      message_ids: ["msg1", "msg2"],
      output_format: "markdown",
    });

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain(
        "Must specify at least one of add_labels or remove_labels"
      );
    }
  });

  it("allows add_labels only", async () => {
    const client = createMockGmailClient();
    const result = await batchModifyTool(client, {
      message_ids: ["msg1"],
      add_labels: ["STARRED"],
      output_format: "markdown",
    });

    expect(result.isError).not.toBe(true);
  });

  it("allows remove_labels only", async () => {
    const client = createMockGmailClient();
    const result = await batchModifyTool(client, {
      message_ids: ["msg1"],
      remove_labels: ["UNREAD"],
      output_format: "markdown",
    });

    expect(result.isError).not.toBe(true);
  });
});

describe("sendEmailTool preview mode", () => {
  it("does not send when confirm is false", async () => {
    const client = createMockGmailClient();
    const result = await sendEmailTool(client, {
      to: "test@example.com",
      subject: "Test",
      body: "Body",
      content_type: "text/plain",
      confirm: false,
      output_format: "markdown",
    });

    expect(client.sendEmail).not.toHaveBeenCalled();
    expect(result.structuredContent?.status).toBe("preview");
    expect(result.structuredContent?.sent).toBe(false);
  });

  it("sends when confirm is true", async () => {
    const client = createMockGmailClient();
    const result = await sendEmailTool(client, {
      to: "test@example.com",
      subject: "Test",
      body: "Body",
      content_type: "text/plain",
      confirm: true,
      output_format: "markdown",
    });

    expect(client.sendEmail).toHaveBeenCalledWith(
      "test@example.com",
      "Test",
      "Body",
      "text/plain",
      undefined,
      undefined
    );
    expect(result.structuredContent?.status).toBe("sent");
    expect(result.structuredContent?.sent).toBe(true);
  });
});

describe("replyTool preview mode", () => {
  it("does not reply when confirm is false", async () => {
    const client = createMockGmailClient();
    await replyTool(client, {
      message_id: "msg123",
      body: "Reply body",
      content_type: "text/plain",
      confirm: false,
      output_format: "markdown",
    });

    expect(client.getMessage).toHaveBeenCalled();
    expect(client.replyToEmail).not.toHaveBeenCalled();
  });

  it("sends reply when confirm is true", async () => {
    const client = createMockGmailClient();
    await replyTool(client, {
      message_id: "msg123",
      body: "Reply body",
      content_type: "text/plain",
      confirm: true,
      output_format: "markdown",
    });

    expect(client.getMessage).toHaveBeenCalled();
    expect(client.replyToEmail).toHaveBeenCalled();
  });
});

describe("createLabelTool validation", () => {
  it("returns error when only background_color provided", async () => {
    const client = createMockGmailClient();
    const result = await createLabelTool(client, {
      name: "Test Label",
      background_color: "#ff0000",
      output_format: "markdown",
    });

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain(
        "Both background_color and text_color must be provided together"
      );
    }
  });

  it("returns error when only text_color provided", async () => {
    const client = createMockGmailClient();
    const result = await createLabelTool(client, {
      name: "Test Label",
      text_color: "#ffffff",
      output_format: "markdown",
    });

    expect(result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain(
        "Both background_color and text_color must be provided together"
      );
    }
  });

  it("allows both colors together", async () => {
    const client = createMockGmailClient();
    const result = await createLabelTool(client, {
      name: "Test Label",
      background_color: "#ff0000",
      text_color: "#ffffff",
      output_format: "markdown",
    });

    expect(result.isError).not.toBe(true);
    expect(client.createLabel).toHaveBeenCalledWith(
      "Test Label",
      undefined,
      undefined,
      "#ff0000",
      "#ffffff"
    );
  });

  it("allows neither color", async () => {
    const client = createMockGmailClient();
    const result = await createLabelTool(client, {
      name: "Test Label",
      output_format: "markdown",
    });

    expect(result.isError).not.toBe(true);
    expect(client.createLabel).toHaveBeenCalledWith(
      "Test Label",
      undefined,
      undefined,
      undefined,
      undefined
    );
  });
});

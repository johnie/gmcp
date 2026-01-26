/**
 * Tests for tool input schemas validation
 */

import { describe, expect, it } from "vitest";
import { CreateLabelInputSchema } from "@/tools/create-label.ts";
import { DeleteLabelInputSchema } from "@/tools/delete-label.ts";
import { GetEmailInputSchema } from "@/tools/get-email.ts";
import { ModifyLabelsInputSchema } from "@/tools/modify-labels.ts";
import { SearchEmailsInputSchema } from "@/tools/search.ts";
import { SendEmailInputSchema } from "@/tools/send-email.ts";

describe("SearchEmailsInputSchema", () => {
  it("validates valid minimal input", () => {
    const input = { query: "test query" };
    const result = SearchEmailsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates valid full input", () => {
    const input = {
      query: "from:test@example.com",
      max_results: 50,
      include_body: true,
      page_token: "token123",
      output_format: "json" as const,
    };
    const result = SearchEmailsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("applies default values", () => {
    const input = { query: "test" };
    const result = SearchEmailsInputSchema.parse(input);
    expect(result.max_results).toBe(10);
    expect(result.include_body).toBe(false);
    expect(result.output_format).toBe("markdown");
  });

  it("rejects empty query", () => {
    const input = { query: "" };
    const result = SearchEmailsInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("validates max_results bounds", () => {
    const tooSmall = { query: "test", max_results: 0 };
    expect(SearchEmailsInputSchema.safeParse(tooSmall).success).toBe(false);

    const tooLarge = { query: "test", max_results: 101 };
    expect(SearchEmailsInputSchema.safeParse(tooLarge).success).toBe(false);

    const valid = { query: "test", max_results: 50 };
    expect(SearchEmailsInputSchema.safeParse(valid).success).toBe(true);
  });

  it("validates output_format enum", () => {
    const invalid = { query: "test", output_format: "xml" };
    expect(SearchEmailsInputSchema.safeParse(invalid).success).toBe(false);

    const markdown = { query: "test", output_format: "markdown" };
    expect(SearchEmailsInputSchema.safeParse(markdown).success).toBe(true);

    const json = { query: "test", output_format: "json" };
    expect(SearchEmailsInputSchema.safeParse(json).success).toBe(true);
  });
});

describe("GetEmailInputSchema", () => {
  it("validates valid minimal input", () => {
    const input = { message_id: "msg123" };
    const result = GetEmailInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("applies default values", () => {
    const input = { message_id: "msg123" };
    const result = GetEmailInputSchema.parse(input);
    expect(result.include_body).toBe(true);
    expect(result.output_format).toBe("markdown");
  });

  it("rejects empty message_id", () => {
    const input = { message_id: "" };
    const result = GetEmailInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("ModifyLabelsInputSchema", () => {
  it("validates valid minimal input", () => {
    const input = { message_id: "msg123", add_labels: ["STARRED"] };
    const result = ModifyLabelsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates with both add and remove labels", () => {
    const input = {
      message_id: "msg123",
      add_labels: ["STARRED"],
      remove_labels: ["UNREAD"],
    };
    const result = ModifyLabelsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("allows optional add_labels and remove_labels", () => {
    const input = { message_id: "msg123" };
    const result = ModifyLabelsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates label arrays", () => {
    const input = {
      message_id: "msg123",
      add_labels: ["INBOX", "STARRED"],
      remove_labels: ["UNREAD"],
    };
    const result = ModifyLabelsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.add_labels).toHaveLength(2);
      expect(result.data.remove_labels).toHaveLength(1);
    }
  });
});

describe("SendEmailInputSchema", () => {
  it("validates valid minimal input", () => {
    const input = {
      to: "test@example.com",
      subject: "Test",
      body: "Hello",
    };
    const result = SendEmailInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates valid full input", () => {
    const input = {
      to: "test@example.com",
      subject: "Test Subject",
      body: "Email body",
      content_type: "text/html" as const,
      cc: "cc@example.com",
      bcc: "bcc@example.com",
      confirm: true,
      output_format: "json" as const,
    };
    const result = SendEmailInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("applies default values", () => {
    const input = {
      to: "test@example.com",
      subject: "Test",
      body: "Body",
    };
    const result = SendEmailInputSchema.parse(input);
    expect(result.content_type).toBe("text/plain");
    expect(result.confirm).toBe(false);
    expect(result.output_format).toBe("markdown");
  });

  it("validates email addresses", () => {
    const invalidTo = { to: "invalid", subject: "Test", body: "Body" };
    expect(SendEmailInputSchema.safeParse(invalidTo).success).toBe(false);

    const invalidCc = {
      to: "valid@example.com",
      subject: "Test",
      body: "Body",
      cc: "invalid",
    };
    expect(SendEmailInputSchema.safeParse(invalidCc).success).toBe(false);

    const invalidBcc = {
      to: "valid@example.com",
      subject: "Test",
      body: "Body",
      bcc: "invalid",
    };
    expect(SendEmailInputSchema.safeParse(invalidBcc).success).toBe(false);
  });

  it("validates content_type enum", () => {
    const invalid = {
      to: "test@example.com",
      subject: "Test",
      body: "Body",
      content_type: "text/xml",
    };
    expect(SendEmailInputSchema.safeParse(invalid).success).toBe(false);

    const plainText = {
      to: "test@example.com",
      subject: "Test",
      body: "Body",
      content_type: "text/plain",
    };
    expect(SendEmailInputSchema.safeParse(plainText).success).toBe(true);

    const html = {
      to: "test@example.com",
      subject: "Test",
      body: "Body",
      content_type: "text/html",
    };
    expect(SendEmailInputSchema.safeParse(html).success).toBe(true);
  });

  it("rejects empty required fields", () => {
    const emptySubject = {
      to: "test@example.com",
      subject: "",
      body: "Body",
    };
    expect(SendEmailInputSchema.safeParse(emptySubject).success).toBe(false);

    const emptyBody = {
      to: "test@example.com",
      subject: "Subject",
      body: "",
    };
    expect(SendEmailInputSchema.safeParse(emptyBody).success).toBe(false);
  });
});

describe("DeleteLabelInputSchema", () => {
  it("validates valid input", () => {
    const input = { label_id: "Label_123" };
    const result = DeleteLabelInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("applies default output_format", () => {
    const input = { label_id: "Label_123" };
    const result = DeleteLabelInputSchema.parse(input);
    expect(result.output_format).toBe("markdown");
  });

  it("rejects empty label_id", () => {
    const input = { label_id: "" };
    const result = DeleteLabelInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("CreateLabelInputSchema", () => {
  it("validates valid minimal input", () => {
    const input = { name: "New Label" };
    const result = CreateLabelInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates valid full input", () => {
    const input = {
      name: "Important Label",
      message_list_visibility: "show" as const,
      label_list_visibility: "labelShow" as const,
      background_color: "#ff0000",
      text_color: "#ffffff",
      output_format: "json" as const,
    };
    const result = CreateLabelInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("applies default output_format", () => {
    const input = { name: "Label" };
    const result = CreateLabelInputSchema.parse(input);
    expect(result.output_format).toBe("markdown");
  });

  it("validates message_list_visibility enum", () => {
    const invalid = { name: "Label", message_list_visibility: "invalid" };
    expect(CreateLabelInputSchema.safeParse(invalid).success).toBe(false);

    const show = { name: "Label", message_list_visibility: "show" };
    expect(CreateLabelInputSchema.safeParse(show).success).toBe(true);

    const hide = { name: "Label", message_list_visibility: "hide" };
    expect(CreateLabelInputSchema.safeParse(hide).success).toBe(true);
  });

  it("validates label_list_visibility enum", () => {
    const invalid = { name: "Label", label_list_visibility: "invalid" };
    expect(CreateLabelInputSchema.safeParse(invalid).success).toBe(false);

    const labelShow = { name: "Label", label_list_visibility: "labelShow" };
    expect(CreateLabelInputSchema.safeParse(labelShow).success).toBe(true);

    const labelShowIfUnread = {
      name: "Label",
      label_list_visibility: "labelShowIfUnread",
    };
    expect(CreateLabelInputSchema.safeParse(labelShowIfUnread).success).toBe(
      true
    );

    const labelHide = { name: "Label", label_list_visibility: "labelHide" };
    expect(CreateLabelInputSchema.safeParse(labelHide).success).toBe(true);
  });

  it("accepts color parameters", () => {
    const input = {
      name: "Colored Label",
      background_color: "#ff0000",
      text_color: "#ffffff",
    };
    const result = CreateLabelInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const input = { name: "" };
    const result = CreateLabelInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

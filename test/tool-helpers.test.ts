/**
 * Tests for tool helper utilities
 */

import { describe, expect, it } from "vitest";
import {
  createErrorResponse,
  createSuccessResponse,
  formatEmailForOutput,
} from "@/utils/tool-helpers.ts";

describe("formatEmailForOutput", () => {
  it("formats email with all fields", () => {
    const email = {
      id: "msg123",
      threadId: "thread456",
      subject: "Test Subject",
      from: "sender@example.com",
      to: "recipient@example.com",
      date: "2024-01-01",
      snippet: "Test snippet",
      body: "Test body content",
      labels: ["INBOX", "UNREAD"],
    };

    const result = formatEmailForOutput(email);

    expect(result).toEqual({
      id: "msg123",
      thread_id: "thread456",
      subject: "Test Subject",
      from: "sender@example.com",
      to: "recipient@example.com",
      date: "2024-01-01",
      snippet: "Test snippet",
      body: "Test body content",
      labels: ["INBOX", "UNREAD"],
    });
  });

  it("formats email without optional fields", () => {
    const email = {
      id: "msg123",
      threadId: "thread456",
      subject: "Test Subject",
      from: "sender@example.com",
      to: "recipient@example.com",
      date: "2024-01-01",
      snippet: "Test snippet",
    };

    const result = formatEmailForOutput(email);

    expect(result).toEqual({
      id: "msg123",
      thread_id: "thread456",
      subject: "Test Subject",
      from: "sender@example.com",
      to: "recipient@example.com",
      date: "2024-01-01",
      snippet: "Test snippet",
    });
    expect(result).not.toHaveProperty("body");
    expect(result).not.toHaveProperty("labels");
  });
});

describe("createErrorResponse", () => {
  it("creates error response from Error object", () => {
    const error = new Error("Test error message");
    const result = createErrorResponse("testing", error);

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error testing: Test error message",
        },
      ],
      isError: true,
    });
  });

  it("creates error response from string", () => {
    const result = createErrorResponse("processing", "Something went wrong");

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error processing: Something went wrong",
        },
      ],
      isError: true,
    });
  });

  it("creates error response from non-Error object", () => {
    const result = createErrorResponse("handling", { code: 500 });

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Error handling: [object Object]",
        },
      ],
      isError: true,
    });
  });
});

describe("createSuccessResponse", () => {
  it("creates success response with structured content", () => {
    const textContent = "Operation successful";
    const structuredData = { status: "ok", count: 5 };

    const result = createSuccessResponse(textContent, structuredData);

    expect(result).toEqual({
      content: [{ type: "text", text: "Operation successful" }],
      structuredContent: { status: "ok", count: 5 },
    });
  });

  it("creates success response without structured content", () => {
    const result = createSuccessResponse("Simple success message");

    expect(result).toEqual({
      content: [{ type: "text", text: "Simple success message" }],
    });
    expect(result).not.toHaveProperty("structuredContent");
  });
});

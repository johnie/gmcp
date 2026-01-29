/**
 * Tests for tool registry
 */

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  DESTRUCTIVE_ANNOTATIONS,
  MODIFY_ANNOTATIONS,
  READ_ONLY_ANNOTATIONS,
  registerTools,
  SEND_ANNOTATIONS,
  type ToolDefinition,
} from "@/tool-registry.ts";

describe("annotation constants", () => {
  it("READ_ONLY_ANNOTATIONS has correct values", () => {
    expect(READ_ONLY_ANNOTATIONS).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    });
  });

  it("MODIFY_ANNOTATIONS has correct values", () => {
    expect(MODIFY_ANNOTATIONS).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
  });

  it("SEND_ANNOTATIONS has correct values", () => {
    expect(SEND_ANNOTATIONS).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
  });

  it("DESTRUCTIVE_ANNOTATIONS has correct values", () => {
    expect(DESTRUCTIVE_ANNOTATIONS).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    });
  });
});

describe("registerTools", () => {
  it("registers tools with server", () => {
    const mockServer = {
      registerTool: vi.fn(),
    };

    const mockClient = { fetch: vi.fn() };

    const tools: ToolDefinition<{ query: string }, typeof mockClient>[] = [
      {
        name: "test_tool",
        title: "Test Tool",
        description: "A test tool",
        inputSchema: z.object({ query: z.string() }),
        annotations: READ_ONLY_ANNOTATIONS,
        handler: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: "result" }],
        }),
      },
    ];

    registerTools(mockServer as never, mockClient, tools as never);

    expect(mockServer.registerTool).toHaveBeenCalledTimes(1);
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      "test_tool",
      expect.objectContaining({
        title: "Test Tool",
        description: "A test tool",
        annotations: READ_ONLY_ANNOTATIONS,
      }),
      expect.any(Function)
    );
  });

  it("registers multiple tools", () => {
    const mockServer = {
      registerTool: vi.fn(),
    };

    const mockClient = { fetch: vi.fn() };

    const tools: ToolDefinition<unknown, typeof mockClient>[] = [
      {
        name: "tool1",
        title: "Tool 1",
        description: "First tool",
        inputSchema: z.object({}),
        annotations: READ_ONLY_ANNOTATIONS,
        handler: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: "result1" }],
        }),
      },
      {
        name: "tool2",
        title: "Tool 2",
        description: "Second tool",
        inputSchema: z.object({}),
        annotations: MODIFY_ANNOTATIONS,
        handler: vi.fn().mockResolvedValue({
          content: [{ type: "text", text: "result2" }],
        }),
      },
    ];

    registerTools(mockServer as never, mockClient, tools as never);

    expect(mockServer.registerTool).toHaveBeenCalledTimes(2);
  });

  it("handler wrapper calls tool handler with client and params", async () => {
    const mockServer = {
      registerTool: vi.fn(),
    };

    const mockClient = { fetch: vi.fn() };
    const mockHandler = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "success" }],
    });

    const tools: ToolDefinition<{ query: string }, typeof mockClient>[] = [
      {
        name: "test_tool",
        title: "Test Tool",
        description: "A test tool",
        inputSchema: z.object({ query: z.string() }),
        annotations: READ_ONLY_ANNOTATIONS,
        handler: mockHandler,
      },
    ];

    registerTools(mockServer as never, mockClient, tools as never);

    // Get the registered handler wrapper
    const registeredHandler = mockServer.registerTool.mock.calls[0][2];

    // Call the handler wrapper
    const result = await registeredHandler({ query: "test" });

    expect(mockHandler).toHaveBeenCalledWith(mockClient, { query: "test" });
    expect(result).toEqual({
      content: [{ type: "text", text: "success" }],
    });
  });

  it("handler wrapper propagates errors", async () => {
    const mockServer = {
      registerTool: vi.fn(),
    };

    const mockClient = { fetch: vi.fn() };
    const mockHandler = vi.fn().mockRejectedValue(new Error("Handler error"));

    const tools: ToolDefinition<unknown, typeof mockClient>[] = [
      {
        name: "error_tool",
        title: "Error Tool",
        description: "A tool that errors",
        inputSchema: z.object({}),
        annotations: READ_ONLY_ANNOTATIONS,
        handler: mockHandler,
      },
    ];

    registerTools(mockServer as never, mockClient, tools as never);

    const registeredHandler = mockServer.registerTool.mock.calls[0][2];

    await expect(registeredHandler({})).rejects.toThrow("Handler error");
  });

  it("handler wrapper logs execution with logger", async () => {
    const mockServer = {
      registerTool: vi.fn(),
    };

    const mockClient = { fetch: vi.fn() };
    const mockLogger = {
      child: vi.fn().mockReturnValue({
        info: vi.fn(),
        error: vi.fn(),
      }),
    };
    const mockHandler = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: "success" }],
    });

    const tools: ToolDefinition<unknown, typeof mockClient>[] = [
      {
        name: "logged_tool",
        title: "Logged Tool",
        description: "A tool with logging",
        inputSchema: z.object({}),
        annotations: READ_ONLY_ANNOTATIONS,
        handler: mockHandler,
      },
    ];

    registerTools(
      mockServer as never,
      mockClient,
      tools as never,
      mockLogger as never
    );

    const registeredHandler = mockServer.registerTool.mock.calls[0][2];
    await registeredHandler({});

    expect(mockLogger.child).toHaveBeenCalledWith({ tool: "logged_tool" });
    const toolLogger = mockLogger.child.mock.results[0].value;
    expect(toolLogger.info).toHaveBeenCalledTimes(2); // start and completion
  });

  it("handler wrapper logs errors with logger", async () => {
    const mockServer = {
      registerTool: vi.fn(),
    };

    const mockClient = { fetch: vi.fn() };
    const toolLoggerMock = {
      info: vi.fn(),
      error: vi.fn(),
    };
    const mockLogger = {
      child: vi.fn().mockReturnValue(toolLoggerMock),
    };
    const mockHandler = vi.fn().mockRejectedValue(new Error("Test error"));

    const tools: ToolDefinition<unknown, typeof mockClient>[] = [
      {
        name: "error_logged_tool",
        title: "Error Logged Tool",
        description: "A tool that errors with logging",
        inputSchema: z.object({}),
        annotations: READ_ONLY_ANNOTATIONS,
        handler: mockHandler,
      },
    ];

    registerTools(
      mockServer as never,
      mockClient,
      tools as never,
      mockLogger as never
    );

    const registeredHandler = mockServer.registerTool.mock.calls[0][2];

    await expect(registeredHandler({})).rejects.toThrow("Test error");
    expect(toolLoggerMock.error).toHaveBeenCalled();
  });
});

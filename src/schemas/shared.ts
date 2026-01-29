/**
 * Shared Zod schemas used across multiple tools
 */

import { z } from "zod";

/**
 * Output format schema - used by all tools that support multiple output formats
 */
export const OutputFormatSchema = z
  .enum(["markdown", "json"])
  .default("markdown")
  .describe("Output format: markdown (default) or json");

/**
 * Gmail message ID schema
 */
export const MessageIdSchema = z
  .string()
  .min(1, "Message ID cannot be empty")
  .describe("Gmail message ID");

/**
 * Gmail thread ID schema
 */
export const ThreadIdSchema = z
  .string()
  .min(1, "Thread ID cannot be empty")
  .describe("Gmail thread ID");

/**
 * Attachment output format schema - used by attachment tools
 */
export const AttachmentOutputFormatSchema = z
  .enum(["base64", "json"])
  .default("base64")
  .describe("Output format: base64 (default) or json");

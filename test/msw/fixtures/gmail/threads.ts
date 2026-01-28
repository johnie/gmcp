/**
 * Gmail thread fixtures for MSW handlers
 */

import type { gmail_v1 } from "googleapis";
import { multipartMessage, simpleTextMessage } from "./messages.ts";

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
 * Thread with single message
 */
export const singleMessageThread: gmail_v1.Schema$Thread = {
  id: "thread_001",
  messages: [simpleTextMessage],
};

/**
 * Thread with conversation (multiple messages)
 */
export const conversationThread: gmail_v1.Schema$Thread = {
  id: "thread_conversation",
  messages: [
    {
      id: "msg_conv_001",
      threadId: "thread_conversation",
      labelIds: ["INBOX"],
      snippet: "Hey, are you available for a meeting tomorrow?",
      payload: {
        mimeType: "text/plain",
        headers: [
          { name: "From", value: "alice@example.com" },
          { name: "To", value: "bob@example.com" },
          { name: "Subject", value: "Meeting Request" },
          { name: "Date", value: "Mon, 15 Jan 2024 09:00:00 +0000" },
          { name: "Message-ID", value: "<msg_conv_001@example.com>" },
        ],
        body: {
          data: base64UrlEncode(
            "Hey, are you available for a meeting tomorrow?"
          ),
        },
      },
    },
    {
      id: "msg_conv_002",
      threadId: "thread_conversation",
      labelIds: ["INBOX", "SENT"],
      snippet: "Yes, I am free at 2pm. Does that work?",
      payload: {
        mimeType: "text/plain",
        headers: [
          { name: "From", value: "bob@example.com" },
          { name: "To", value: "alice@example.com" },
          { name: "Subject", value: "Re: Meeting Request" },
          { name: "Date", value: "Mon, 15 Jan 2024 10:30:00 +0000" },
          { name: "Message-ID", value: "<msg_conv_002@example.com>" },
          { name: "In-Reply-To", value: "<msg_conv_001@example.com>" },
          { name: "References", value: "<msg_conv_001@example.com>" },
        ],
        body: {
          data: base64UrlEncode("Yes, I am free at 2pm. Does that work?"),
        },
      },
    },
    {
      id: "msg_conv_003",
      threadId: "thread_conversation",
      labelIds: ["INBOX"],
      snippet: "Perfect! I'll send a calendar invite.",
      payload: {
        mimeType: "text/plain",
        headers: [
          { name: "From", value: "alice@example.com" },
          { name: "To", value: "bob@example.com" },
          { name: "Subject", value: "Re: Meeting Request" },
          { name: "Date", value: "Mon, 15 Jan 2024 11:00:00 +0000" },
          { name: "Message-ID", value: "<msg_conv_003@example.com>" },
          {
            name: "In-Reply-To",
            value: "<msg_conv_002@example.com>",
          },
          {
            name: "References",
            value: "<msg_conv_001@example.com> <msg_conv_002@example.com>",
          },
        ],
        body: {
          data: base64UrlEncode("Perfect! I'll send a calendar invite."),
        },
      },
    },
  ],
};

/**
 * Thread with multipart message
 */
export const multipartThread: gmail_v1.Schema$Thread = {
  id: "thread_002",
  messages: [multipartMessage],
};

/**
 * Get all thread fixtures as a map by ID
 */
export const threadFixtures: Map<string, gmail_v1.Schema$Thread> = new Map([
  ["thread_001", singleMessageThread],
  ["thread_002", multipartThread],
  ["thread_conversation", conversationThread],
]);

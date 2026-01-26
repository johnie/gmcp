/**
 * Gmail API wrapper for MCP Server
 */

import type { OAuth2Client } from "google-auth-library";
import type { gmail_v1 } from "googleapis";
import { google } from "googleapis";
import { EMAIL_FETCH_BATCH_SIZE } from "@/constants.ts";
import type {
  AttachmentInfo,
  DraftResult,
  EmailMessage,
  GmailLabel,
  GmailSearchResult,
  SendResult,
} from "@/types.ts";
import { getHeader } from "@/types.ts";

/**
 * Regex for removing base64url padding
 */
const BASE64_PADDING_REGEX = /=+$/;

/**
 * Gmail API client interface
 */
export interface GmailClient {
  searchEmails(
    query: string,
    maxResults?: number,
    includeBody?: boolean,
    pageToken?: string
  ): Promise<GmailSearchResult>;

  getMessage(messageId: string, includeBody?: boolean): Promise<EmailMessage>;

  getThread(threadId: string, includeBody?: boolean): Promise<EmailMessage[]>;

  listAttachments(messageId: string): Promise<AttachmentInfo[]>;

  getAttachment(messageId: string, attachmentId: string): Promise<string>;

  modifyLabels(
    messageId: string,
    addLabelIds?: string[],
    removeLabelIds?: string[]
  ): Promise<EmailMessage>;

  batchModifyLabels(
    messageIds: string[],
    addLabelIds?: string[],
    removeLabelIds?: string[]
  ): Promise<void>;

  sendEmail(
    to: string,
    subject: string,
    body: string,
    contentType?: "text/plain" | "text/html",
    cc?: string,
    bcc?: string
  ): Promise<SendResult>;

  replyToEmail(
    to: string,
    subject: string,
    body: string,
    threadId: string,
    messageId: string,
    contentType?: "text/plain" | "text/html",
    cc?: string
  ): Promise<SendResult>;

  createDraft(
    to: string,
    subject: string,
    body: string,
    contentType?: "text/plain" | "text/html",
    cc?: string,
    bcc?: string
  ): Promise<DraftResult>;

  listLabels(): Promise<GmailLabel[]>;

  getLabel(labelId: string): Promise<GmailLabel>;

  createLabel(
    name: string,
    messageListVisibility?: "show" | "hide",
    labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide",
    backgroundColor?: string,
    textColor?: string
  ): Promise<GmailLabel>;

  updateLabel(
    labelId: string,
    name?: string,
    messageListVisibility?: "show" | "hide",
    labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide",
    backgroundColor?: string,
    textColor?: string
  ): Promise<GmailLabel>;

  deleteLabel(labelId: string): Promise<void>;
}

/**
 * Decode base64url string
 * Exported for testing
 */
export function decodeBase64(data: string): string {
  try {
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch (_error) {
    return "(error decoding body)";
  }
}

/**
 * Get body of a specific MIME type from message parts
 * Exported for testing
 */
export function getPartBody(
  part: gmail_v1.Schema$MessagePart,
  mimeType: string
): string {
  if (part.mimeType === mimeType && part.body?.data) {
    return decodeBase64(part.body.data);
  }

  if (part.parts) {
    for (const subPart of part.parts) {
      const body = getPartBody(subPart, mimeType);
      if (body) {
        return body;
      }
    }
  }

  return "";
}

/**
 * Extract email body from message payload
 * Exported for testing
 */
export function extractBody(
  payload: gmail_v1.Schema$MessagePart | undefined
): string {
  if (!payload) {
    return "";
  }

  let body = getPartBody(payload, "text/plain");

  if (!body) {
    body = getPartBody(payload, "text/html");
  }

  if (!body && payload.body?.data) {
    body = decodeBase64(payload.body.data);
  }

  return body || "(no body)";
}

/**
 * Parse Gmail message into EmailMessage structure
 * Exported for testing
 */
export function parseMessage(
  message: gmail_v1.Schema$Message,
  includeBody: boolean
): EmailMessage {
  const headers = message.payload?.headers || [];

  const subject = getHeader(headers, "Subject");
  const from = getHeader(headers, "From");
  const to = getHeader(headers, "To");
  const date = getHeader(headers, "Date");

  const email: EmailMessage = {
    id: message.id || "",
    threadId: message.threadId || "",
    subject: subject || "(no subject)",
    from: from || "(unknown)",
    to: to || "(unknown)",
    date: date || "",
    snippet: message.snippet || "",
    labels: message.labelIds || undefined,
  };

  if (includeBody) {
    email.body = extractBody(message.payload);
  }

  return email;
}

/**
 * Create a MIME message
 * Exported for testing
 */
export function createMimeMessage(params: {
  to: string;
  subject: string;
  body: string;
  contentType: "text/plain" | "text/html";
  cc?: string;
  bcc?: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const lines: string[] = [];

  lines.push(`To: ${params.to}`);
  if (params.cc) {
    lines.push(`Cc: ${params.cc}`);
  }
  if (params.bcc) {
    lines.push(`Bcc: ${params.bcc}`);
  }
  lines.push(`Subject: ${params.subject}`);
  if (params.inReplyTo) {
    lines.push(`In-Reply-To: ${params.inReplyTo}`);
  }
  if (params.references) {
    lines.push(`References: ${params.references}`);
  }
  lines.push(`Content-Type: ${params.contentType}; charset=utf-8`);
  lines.push("");
  lines.push(params.body);

  return lines.join("\r\n");
}

/**
 * Encode message for Gmail API
 * Exported for testing
 */
export function encodeMessage(message: string): string {
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(BASE64_PADDING_REGEX, "");
}

/**
 * Parse Gmail API label response into GmailLabel structure
 * Exported for testing
 */
export function parseLabel(label: gmail_v1.Schema$Label): GmailLabel {
  return {
    id: label.id || "",
    name: label.name || "",
    type: label.type === "system" ? "system" : "user",
    messageListVisibility: label.messageListVisibility as
      | "show"
      | "hide"
      | undefined,
    labelListVisibility: label.labelListVisibility as
      | "labelShow"
      | "labelShowIfUnread"
      | "labelHide"
      | undefined,
    messagesTotal: label.messagesTotal || undefined,
    messagesUnread: label.messagesUnread || undefined,
    color: label.color
      ? {
          textColor: label.color.textColor || "",
          backgroundColor: label.color.backgroundColor || "",
        }
      : undefined,
  };
}

/**
 * Create Gmail API client
 */
export function createGmailClient(auth: OAuth2Client): GmailClient {
  const gmail = google.gmail({ version: "v1", auth });

  return {
    /**
     * Search for emails using Gmail query syntax
     * @param query Gmail search query (e.g., "from:user@example.com subject:test")
     * @param maxResults Maximum number of results to return
     * @param includeBody Whether to fetch full email body
     * @param pageToken Token for pagination
     */
    async searchEmails(
      query: string,
      maxResults = 10,
      includeBody = false,
      pageToken?: string
    ): Promise<GmailSearchResult> {
      try {
        const listResponse = await gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults,
          pageToken,
        });

        const messages = listResponse.data.messages || [];
        const resultSizeEstimate = listResponse.data.resultSizeEstimate || 0;
        const nextPageToken = listResponse.data.nextPageToken;

        // Filter out messages without IDs
        const validMessages = messages.filter((message) => message.id);

        // Batch fetch messages with concurrency limit for rate limiting
        const emails: EmailMessage[] = [];

        for (let i = 0; i < validMessages.length; i += EMAIL_FETCH_BATCH_SIZE) {
          const batch = validMessages.slice(i, i + EMAIL_FETCH_BATCH_SIZE);

          const batchEmails = await Promise.all(
            batch.map(async (message) => {
              // Message ID is guaranteed to exist due to filter above
              const messageId = message.id ?? "";
              const details = await gmail.users.messages.get({
                userId: "me",
                id: messageId,
                format: includeBody ? "full" : "metadata",
                metadataHeaders: includeBody
                  ? undefined
                  : ["From", "To", "Subject", "Date"],
              });

              return parseMessage(details.data, includeBody);
            })
          );

          emails.push(...batchEmails);
        }

        return {
          emails,
          total_estimate: resultSizeEstimate,
          has_more: !!nextPageToken,
          next_page_token: nextPageToken || undefined,
        };
      } catch (error) {
        throw new Error(
          `Failed to search emails with query "${query}": ${error}`
        );
      }
    },

    /**
     * Get a single message by ID
     */
    async getMessage(
      messageId: string,
      includeBody = false
    ): Promise<EmailMessage> {
      try {
        const response = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: includeBody ? "full" : "metadata",
          metadataHeaders: includeBody
            ? undefined
            : ["From", "To", "Subject", "Date"],
        });

        return parseMessage(response.data, includeBody);
      } catch (error) {
        throw new Error(`Failed to get message ${messageId}: ${error}`);
      }
    },

    /**
     * Get a thread (conversation) by ID
     */
    async getThread(
      threadId: string,
      includeBody = false
    ): Promise<EmailMessage[]> {
      try {
        const response = await gmail.users.threads.get({
          userId: "me",
          id: threadId,
          format: includeBody ? "full" : "metadata",
          metadataHeaders: includeBody
            ? undefined
            : ["From", "To", "Subject", "Date"],
        });

        const messages = response.data.messages || [];
        return messages.map((message) => parseMessage(message, includeBody));
      } catch (error) {
        throw new Error(`Failed to get thread ${threadId}: ${error}`);
      }
    },

    /**
     * List attachments for a message
     */
    async listAttachments(messageId: string): Promise<AttachmentInfo[]> {
      try {
        const response = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "full",
        });

        const attachments: AttachmentInfo[] = [];

        const extractAttachments = (part: gmail_v1.Schema$MessagePart) => {
          if (part.filename && part.body?.attachmentId) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType || "application/octet-stream",
              size: part.body.size || 0,
              attachmentId: part.body.attachmentId,
            });
          }

          if (part.parts) {
            for (const subPart of part.parts) {
              extractAttachments(subPart);
            }
          }
        };

        if (response.data.payload) {
          extractAttachments(response.data.payload);
        }

        return attachments;
      } catch (error) {
        throw new Error(
          `Failed to list attachments for ${messageId}: ${error}`
        );
      }
    },

    /**
     * Get attachment data
     */
    async getAttachment(
      messageId: string,
      attachmentId: string
    ): Promise<string> {
      try {
        const response = await gmail.users.messages.attachments.get({
          userId: "me",
          messageId,
          id: attachmentId,
        });

        if (!response.data.data) {
          throw new Error("Attachment data not found");
        }

        // Gmail returns base64url encoded data
        return response.data.data;
      } catch (error) {
        throw new Error(
          `Failed to get attachment ${attachmentId} from message ${messageId}: ${error}`
        );
      }
    },

    /**
     * Modify labels on a message
     */
    async modifyLabels(
      messageId: string,
      addLabelIds?: string[],
      removeLabelIds?: string[]
    ): Promise<EmailMessage> {
      try {
        const response = await gmail.users.messages.modify({
          userId: "me",
          id: messageId,
          requestBody: {
            addLabelIds: addLabelIds || [],
            removeLabelIds: removeLabelIds || [],
          },
        });

        return parseMessage(response.data, false);
      } catch (error) {
        throw new Error(`Failed to modify labels for ${messageId}: ${error}`);
      }
    },

    /**
     * Batch modify labels on multiple messages
     */
    async batchModifyLabels(
      messageIds: string[],
      addLabelIds?: string[],
      removeLabelIds?: string[]
    ): Promise<void> {
      try {
        await gmail.users.messages.batchModify({
          userId: "me",
          requestBody: {
            ids: messageIds,
            addLabelIds: addLabelIds || [],
            removeLabelIds: removeLabelIds || [],
          },
        });
      } catch (error) {
        throw new Error(
          `Failed to batch modify labels on ${messageIds.length} messages: ${error}`
        );
      }
    },

    /**
     * Send an email
     */
    async sendEmail(
      to: string,
      subject: string,
      body: string,
      contentType: "text/plain" | "text/html" = "text/plain",
      cc?: string,
      bcc?: string
    ): Promise<SendResult> {
      try {
        const mimeMessage = createMimeMessage({
          to,
          subject,
          body,
          contentType,
          cc,
          bcc,
        });
        const encodedMessage = encodeMessage(mimeMessage);

        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        });

        return {
          id: response.data.id || "",
          threadId: response.data.threadId || "",
          labelIds: response.data.labelIds || undefined,
        };
      } catch (error) {
        throw new Error(`Failed to send email to ${to}: ${error}`);
      }
    },

    /**
     * Reply to an email
     */
    async replyToEmail(
      to: string,
      subject: string,
      body: string,
      threadId: string,
      messageId: string,
      contentType: "text/plain" | "text/html" = "text/plain",
      cc?: string
    ): Promise<SendResult> {
      try {
        const replySubject = subject.startsWith("Re:")
          ? subject
          : `Re: ${subject}`;

        const mimeMessage = createMimeMessage({
          to,
          subject: replySubject,
          body,
          contentType,
          cc,
          inReplyTo: `<${messageId}>`,
          references: `<${messageId}>`,
        });
        const encodedMessage = encodeMessage(mimeMessage);

        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
            threadId,
          },
        });

        return {
          id: response.data.id || "",
          threadId: response.data.threadId || "",
          labelIds: response.data.labelIds || undefined,
        };
      } catch (error) {
        throw new Error(
          `Failed to reply to message ${messageId} in thread ${threadId}: ${error}`
        );
      }
    },

    /**
     * Create a draft
     */
    async createDraft(
      to: string,
      subject: string,
      body: string,
      contentType: "text/plain" | "text/html" = "text/plain",
      cc?: string,
      bcc?: string
    ): Promise<DraftResult> {
      try {
        const mimeMessage = createMimeMessage({
          to,
          subject,
          body,
          contentType,
          cc,
          bcc,
        });
        const encodedMessage = encodeMessage(mimeMessage);

        const response = await gmail.users.drafts.create({
          userId: "me",
          requestBody: {
            message: {
              raw: encodedMessage,
            },
          },
        });

        return {
          id: response.data.id || "",
          message: {
            id: response.data.message?.id || "",
            threadId: response.data.message?.threadId || "",
          },
        };
      } catch (error) {
        throw new Error(`Failed to create draft to ${to}: ${error}`);
      }
    },

    /**
     * List all labels (system and user-created)
     */
    async listLabels(): Promise<GmailLabel[]> {
      try {
        const response = await gmail.users.labels.list({
          userId: "me",
        });

        const labels = response.data.labels || [];
        return labels.map((label) => parseLabel(label));
      } catch (error) {
        throw new Error(`Failed to list labels: ${error}`);
      }
    },

    /**
     * Get a single label by ID
     */
    async getLabel(labelId: string): Promise<GmailLabel> {
      try {
        const response = await gmail.users.labels.get({
          userId: "me",
          id: labelId,
        });

        return parseLabel(response.data);
      } catch (error) {
        throw new Error(`Failed to get label ${labelId}: ${error}`);
      }
    },

    /**
     * Create a new label
     */
    async createLabel(
      name: string,
      messageListVisibility?: "show" | "hide",
      labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide",
      backgroundColor?: string,
      textColor?: string
    ): Promise<GmailLabel> {
      try {
        const response = await gmail.users.labels.create({
          userId: "me",
          requestBody: {
            name,
            messageListVisibility,
            labelListVisibility,
            color:
              backgroundColor && textColor
                ? { backgroundColor, textColor }
                : undefined,
          },
        });

        return parseLabel(response.data);
      } catch (error) {
        throw new Error(`Failed to create label "${name}": ${error}`);
      }
    },

    /**
     * Update a label
     */
    async updateLabel(
      labelId: string,
      name?: string,
      messageListVisibility?: "show" | "hide",
      labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide",
      backgroundColor?: string,
      textColor?: string
    ): Promise<GmailLabel> {
      try {
        const response = await gmail.users.labels.update({
          userId: "me",
          id: labelId,
          requestBody: {
            id: labelId,
            name,
            messageListVisibility,
            labelListVisibility,
            color:
              backgroundColor && textColor
                ? { backgroundColor, textColor }
                : undefined,
          },
        });

        return parseLabel(response.data);
      } catch (error) {
        throw new Error(`Failed to update label ${labelId}: ${error}`);
      }
    },

    /**
     * Delete a label
     */
    async deleteLabel(labelId: string): Promise<void> {
      try {
        await gmail.users.labels.delete({
          userId: "me",
          id: labelId,
        });
      } catch (error) {
        throw new Error(`Failed to delete label ${labelId}: ${error}`);
      }
    },
  };
}

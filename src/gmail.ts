/**
 * Gmail API wrapper for MCP Server
 */

import type { OAuth2Client } from "google-auth-library";
import type { gmail_v1 } from "googleapis";
import { google } from "googleapis";
import type { EmailMessage, GmailSearchResult } from "@/types.ts";
import { getHeader } from "@/types.ts";

/**
 * Regex for removing base64url padding
 */
const BASE64_PADDING_REGEX = /=+$/;

/**
 * Gmail API client wrapper
 */
export class GmailClient {
  private readonly gmail: gmail_v1.Gmail;

  constructor(auth: OAuth2Client) {
    this.gmail = google.gmail({ version: "v1", auth });
  }

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
      const listResponse = await this.gmail.users.messages.list({
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

      // Batch fetch messages with concurrency limit (10 at a time) for rate limiting
      const batchSize = 10;
      const emails: EmailMessage[] = [];

      for (let i = 0; i < validMessages.length; i += batchSize) {
        const batch = validMessages.slice(i, i + batchSize);

        const batchEmails = await Promise.all(
          batch.map(async (message) => {
            // Message ID is guaranteed to exist due to filter above
            const messageId = message.id ?? "";
            const details = await this.gmail.users.messages.get({
              userId: "me",
              id: messageId,
              format: includeBody ? "full" : "metadata",
              metadataHeaders: includeBody
                ? undefined
                : ["From", "To", "Subject", "Date"],
            });

            return this.parseMessage(details.data, includeBody);
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
      throw new Error(`Gmail API error: ${error}`);
    }
  }

  /**
   * Parse Gmail message into EmailMessage structure
   */
  private parseMessage(
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
      email.body = this.extractBody(message.payload);
    }

    return email;
  }

  /**
   * Extract email body from message payload
   */
  private extractBody(
    payload: gmail_v1.Schema$MessagePart | undefined
  ): string {
    if (!payload) {
      return "";
    }

    let body = this.getPartBody(payload, "text/plain");

    if (!body) {
      body = this.getPartBody(payload, "text/html");
    }

    if (!body && payload.body?.data) {
      body = this.decodeBase64(payload.body.data);
    }

    return body || "(no body)";
  }

  /**
   * Get body of a specific MIME type from message parts
   */
  private getPartBody(
    part: gmail_v1.Schema$MessagePart,
    mimeType: string
  ): string {
    if (part.mimeType === mimeType && part.body?.data) {
      return this.decodeBase64(part.body.data);
    }

    if (part.parts) {
      for (const subPart of part.parts) {
        const body = this.getPartBody(subPart, mimeType);
        if (body) {
          return body;
        }
      }
    }

    return "";
  }

  /**
   * Decode base64url string
   */
  private decodeBase64(data: string): string {
    try {
      const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
      return Buffer.from(base64, "base64").toString("utf-8");
    } catch (_error) {
      return "(error decoding body)";
    }
  }

  /**
   * Get a single message by ID
   */
  async getMessage(
    messageId: string,
    includeBody = false
  ): Promise<EmailMessage> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: includeBody ? "full" : "metadata",
        metadataHeaders: includeBody
          ? undefined
          : ["From", "To", "Subject", "Date"],
      });

      return this.parseMessage(response.data, includeBody);
    } catch (error) {
      throw new Error(`Failed to get message ${messageId}: ${error}`);
    }
  }

  /**
   * Get a thread (conversation) by ID
   */
  async getThread(
    threadId: string,
    includeBody = false
  ): Promise<EmailMessage[]> {
    try {
      const response = await this.gmail.users.threads.get({
        userId: "me",
        id: threadId,
        format: includeBody ? "full" : "metadata",
        metadataHeaders: includeBody
          ? undefined
          : ["From", "To", "Subject", "Date"],
      });

      const messages = response.data.messages || [];
      return messages.map((message) => this.parseMessage(message, includeBody));
    } catch (error) {
      throw new Error(`Failed to get thread ${threadId}: ${error}`);
    }
  }

  /**
   * List attachments for a message
   */
  async listAttachments(messageId: string): Promise<
    Array<{
      filename: string;
      mimeType: string;
      size: number;
      attachmentId: string;
    }>
  > {
    try {
      const response = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      const attachments: Array<{
        filename: string;
        mimeType: string;
        size: number;
        attachmentId: string;
      }> = [];

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
      throw new Error(`Failed to list attachments for ${messageId}: ${error}`);
    }
  }

  /**
   * Get attachment data
   */
  async getAttachment(
    messageId: string,
    attachmentId: string
  ): Promise<string> {
    try {
      const response = await this.gmail.users.messages.attachments.get({
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
  }

  /**
   * Modify labels on a message
   */
  async modifyLabels(
    messageId: string,
    addLabelIds?: string[],
    removeLabelIds?: string[]
  ): Promise<EmailMessage> {
    try {
      const response = await this.gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          addLabelIds: addLabelIds || [],
          removeLabelIds: removeLabelIds || [],
        },
      });

      return this.parseMessage(response.data, false);
    } catch (error) {
      throw new Error(`Failed to modify labels for ${messageId}: ${error}`);
    }
  }

  /**
   * Batch modify labels on multiple messages
   */
  async batchModifyLabels(
    messageIds: string[],
    addLabelIds?: string[],
    removeLabelIds?: string[]
  ): Promise<void> {
    try {
      await this.gmail.users.messages.batchModify({
        userId: "me",
        requestBody: {
          ids: messageIds,
          addLabelIds: addLabelIds || [],
          removeLabelIds: removeLabelIds || [],
        },
      });
    } catch (error) {
      throw new Error(`Failed to batch modify labels: ${error}`);
    }
  }

  /**
   * Create a MIME message
   */
  private createMimeMessage(
    to: string,
    subject: string,
    body: string,
    contentType: "text/plain" | "text/html",
    cc?: string,
    bcc?: string,
    inReplyTo?: string,
    references?: string
  ): string {
    const lines: string[] = [];

    lines.push(`To: ${to}`);
    if (cc) {
      lines.push(`Cc: ${cc}`);
    }
    if (bcc) {
      lines.push(`Bcc: ${bcc}`);
    }
    lines.push(`Subject: ${subject}`);
    if (inReplyTo) {
      lines.push(`In-Reply-To: ${inReplyTo}`);
    }
    if (references) {
      lines.push(`References: ${references}`);
    }
    lines.push(`Content-Type: ${contentType}; charset=utf-8`);
    lines.push("");
    lines.push(body);

    return lines.join("\r\n");
  }

  /**
   * Encode message for Gmail API
   */
  private encodeMessage(message: string): string {
    return Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(BASE64_PADDING_REGEX, "");
  }

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
  ): Promise<{ id: string; threadId: string; labelIds?: string[] }> {
    try {
      const mimeMessage = this.createMimeMessage(
        to,
        subject,
        body,
        contentType,
        cc,
        bcc
      );
      const encodedMessage = this.encodeMessage(mimeMessage);

      const response = await this.gmail.users.messages.send({
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
      throw new Error(`Failed to send email: ${error}`);
    }
  }

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
  ): Promise<{ id: string; threadId: string; labelIds?: string[] }> {
    try {
      const replySubject = subject.startsWith("Re:")
        ? subject
        : `Re: ${subject}`;

      const mimeMessage = this.createMimeMessage(
        to,
        replySubject,
        body,
        contentType,
        cc,
        undefined,
        `<${messageId}>`,
        `<${messageId}>`
      );
      const encodedMessage = this.encodeMessage(mimeMessage);

      const response = await this.gmail.users.messages.send({
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
      throw new Error(`Failed to reply to email: ${error}`);
    }
  }

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
  ): Promise<{ id: string; message: { id: string; threadId: string } }> {
    try {
      const mimeMessage = this.createMimeMessage(
        to,
        subject,
        body,
        contentType,
        cc,
        bcc
      );
      const encodedMessage = this.encodeMessage(mimeMessage);

      const response = await this.gmail.users.drafts.create({
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
      throw new Error(`Failed to create draft: ${error}`);
    }
  }
}

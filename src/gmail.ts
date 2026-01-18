/**
 * Gmail API wrapper for MCP Server
 */

import type { OAuth2Client } from "google-auth-library";
import type { gmail_v1 } from "googleapis";
import { google } from "googleapis";
import type { EmailMessage, GmailSearchResult } from "@/types.ts";
import { getHeader } from "@/types.ts";

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

      const emails: EmailMessage[] = [];

      for (const message of messages) {
        if (!message.id) {
          continue;
        }

        const details = await this.gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: includeBody ? "full" : "metadata",
          metadataHeaders: includeBody
            ? undefined
            : ["From", "To", "Subject", "Date"],
        });

        const email = this.parseMessage(details.data, includeBody);
        emails.push(email);
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
}

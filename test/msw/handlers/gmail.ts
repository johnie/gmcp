/**
 * MSW handlers for Gmail API endpoints
 * Base URL: https://gmail.googleapis.com/gmail/v1/users/me
 */

import type { gmail_v1 } from "googleapis";
import { HttpResponse, http } from "msw";
import {
  allLabels,
  labelFixtures,
  messageFixtures,
  threadFixtures,
} from "../fixtures/index.ts";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

/**
 * Default attachment data (base64url encoded)
 */
const DEFAULT_ATTACHMENT_DATA = Buffer.from("Mock attachment content")
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

export const gmailHandlers = [
  /**
   * List/Search messages
   * GET /users/me/messages
   */
  http.get(`${GMAIL_BASE}/messages`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const maxResults = Number(url.searchParams.get("maxResults") || "10");
    const pageToken = url.searchParams.get("pageToken");

    // Get all messages for list response (just id and threadId)
    const allMessages = Array.from(messageFixtures.values());

    // Simple filter by query if provided
    let filtered = allMessages;
    if (query) {
      filtered = allMessages.filter((msg) => {
        const headers = msg.payload?.headers || [];
        const subject = headers.find((h) => h.name === "Subject")?.value || "";
        const from = headers.find((h) => h.name === "From")?.value || "";
        return (
          subject.toLowerCase().includes(query.toLowerCase()) ||
          from.toLowerCase().includes(query.toLowerCase()) ||
          msg.snippet?.toLowerCase().includes(query.toLowerCase())
        );
      });
    }

    // Pagination
    let startIndex = 0;
    if (pageToken) {
      startIndex = Number.parseInt(pageToken, 10);
    }
    const paginatedMessages = filtered.slice(
      startIndex,
      startIndex + maxResults
    );
    const hasMore = startIndex + maxResults < filtered.length;

    const response: gmail_v1.Schema$ListMessagesResponse = {
      messages: paginatedMessages.map((msg) => ({
        id: msg.id,
        threadId: msg.threadId,
      })),
      resultSizeEstimate: filtered.length,
      nextPageToken: hasMore ? String(startIndex + maxResults) : undefined,
    };

    return HttpResponse.json(response);
  }),

  /**
   * Get single message
   * GET /users/me/messages/:id
   */
  http.get(`${GMAIL_BASE}/messages/:id`, ({ params, request }) => {
    const { id } = params;
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "full";

    const message = messageFixtures.get(id as string);

    if (!message) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Message not found: ${id}`,
            errors: [{ domain: "global", reason: "notFound" }],
          },
        },
        { status: 404 }
      );
    }

    // For metadata format, strip body data
    if (format === "metadata") {
      const metadataMessage: gmail_v1.Schema$Message = {
        id: message.id,
        threadId: message.threadId,
        labelIds: message.labelIds,
        snippet: message.snippet,
        payload: {
          mimeType: message.payload?.mimeType,
          headers: message.payload?.headers,
        },
      };
      return HttpResponse.json(metadataMessage);
    }

    return HttpResponse.json(message);
  }),

  /**
   * Get thread
   * GET /users/me/threads/:id
   */
  http.get(`${GMAIL_BASE}/threads/:id`, ({ params, request }) => {
    const { id } = params;
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "full";

    const thread = threadFixtures.get(id as string);

    if (!thread) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Thread not found: ${id}`,
            errors: [{ domain: "global", reason: "notFound" }],
          },
        },
        { status: 404 }
      );
    }

    // For metadata format, strip body data from messages
    if (format === "metadata") {
      const metadataThread: gmail_v1.Schema$Thread = {
        id: thread.id,
        messages: thread.messages?.map((msg) => ({
          id: msg.id,
          threadId: msg.threadId,
          labelIds: msg.labelIds,
          snippet: msg.snippet,
          payload: {
            mimeType: msg.payload?.mimeType,
            headers: msg.payload?.headers,
          },
        })),
      };
      return HttpResponse.json(metadataThread);
    }

    return HttpResponse.json(thread);
  }),

  /**
   * Get attachment
   * GET /users/me/messages/:messageId/attachments/:attachmentId
   */
  http.get(
    `${GMAIL_BASE}/messages/:messageId/attachments/:attachmentId`,
    ({ params }) => {
      const { messageId, attachmentId } = params;

      const message = messageFixtures.get(messageId as string);
      if (!message) {
        return HttpResponse.json(
          {
            error: {
              code: 404,
              message: `Message not found: ${messageId}`,
            },
          },
          { status: 404 }
        );
      }

      const response: gmail_v1.Schema$MessagePartBody = {
        attachmentId: attachmentId as string,
        size: 1234,
        data: DEFAULT_ATTACHMENT_DATA,
      };

      return HttpResponse.json(response);
    }
  ),

  /**
   * Send message
   * POST /users/me/messages/send
   */
  http.post(`${GMAIL_BASE}/messages/send`, async ({ request }) => {
    const body = (await request.json()) as { raw?: string; threadId?: string };

    const response: gmail_v1.Schema$Message = {
      id: `msg_sent_${Date.now()}`,
      threadId: body.threadId || `thread_${Date.now()}`,
      labelIds: ["SENT"],
    };

    return HttpResponse.json(response);
  }),

  /**
   * Modify message labels
   * POST /users/me/messages/:id/modify
   */
  http.post(
    `${GMAIL_BASE}/messages/:id/modify`,
    async ({ params, request }) => {
      const { id } = params;
      const body = (await request.json()) as {
        addLabelIds?: string[];
        removeLabelIds?: string[];
      };

      const message = messageFixtures.get(id as string);
      if (!message) {
        return HttpResponse.json(
          {
            error: {
              code: 404,
              message: `Message not found: ${id}`,
            },
          },
          { status: 404 }
        );
      }

      // Modify labels
      let labels = [...(message.labelIds || [])];
      if (body.removeLabelIds) {
        labels = labels.filter((l) => !body.removeLabelIds?.includes(l));
      }
      if (body.addLabelIds) {
        for (const label of body.addLabelIds) {
          if (!labels.includes(label)) {
            labels.push(label);
          }
        }
      }

      const response: gmail_v1.Schema$Message = {
        id: message.id,
        threadId: message.threadId,
        labelIds: labels,
      };

      return HttpResponse.json(response);
    }
  ),

  /**
   * Batch modify messages
   * POST /users/me/messages/batchModify
   */
  http.post(`${GMAIL_BASE}/messages/batchModify`, () => {
    // Batch modify returns empty response on success
    return new HttpResponse(null, { status: 204 });
  }),

  /**
   * Delete message
   * DELETE /users/me/messages/:id
   */
  http.delete(`${GMAIL_BASE}/messages/:id`, ({ params }) => {
    const { id } = params;

    const message = messageFixtures.get(id as string);
    if (!message) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Message not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),

  /**
   * Create draft
   * POST /users/me/drafts
   */
  http.post(`${GMAIL_BASE}/drafts`, () => {
    const response: gmail_v1.Schema$Draft = {
      id: `draft_${Date.now()}`,
      message: {
        id: `msg_draft_${Date.now()}`,
        threadId: `thread_draft_${Date.now()}`,
      },
    };

    return HttpResponse.json(response);
  }),

  /**
   * List labels
   * GET /users/me/labels
   */
  http.get(`${GMAIL_BASE}/labels`, () => {
    const response: gmail_v1.Schema$ListLabelsResponse = {
      labels: allLabels,
    };
    return HttpResponse.json(response);
  }),

  /**
   * Get single label
   * GET /users/me/labels/:id
   */
  http.get(`${GMAIL_BASE}/labels/:id`, ({ params }) => {
    const { id } = params;
    const label = labelFixtures.get(id as string);

    if (!label) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Label not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(label);
  }),

  /**
   * Create label
   * POST /users/me/labels
   */
  http.post(`${GMAIL_BASE}/labels`, async ({ request }) => {
    const body = (await request.json()) as gmail_v1.Schema$Label;

    const response: gmail_v1.Schema$Label = {
      id: `Label_${Date.now()}`,
      name: body.name,
      type: "user",
      messageListVisibility: body.messageListVisibility,
      labelListVisibility: body.labelListVisibility,
      color: body.color,
      messagesTotal: 0,
      messagesUnread: 0,
    };

    return HttpResponse.json(response);
  }),

  /**
   * Update label
   * PUT /users/me/labels/:id
   */
  http.put(`${GMAIL_BASE}/labels/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as gmail_v1.Schema$Label;

    const existingLabel = labelFixtures.get(id as string);
    if (!existingLabel) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Label not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    const response: gmail_v1.Schema$Label = {
      ...existingLabel,
      name: body.name || existingLabel.name,
      messageListVisibility:
        body.messageListVisibility || existingLabel.messageListVisibility,
      labelListVisibility:
        body.labelListVisibility || existingLabel.labelListVisibility,
      color: body.color || existingLabel.color,
    };

    return HttpResponse.json(response);
  }),

  /**
   * Patch label (partial update)
   * PATCH /users/me/labels/:id
   */
  http.patch(`${GMAIL_BASE}/labels/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as gmail_v1.Schema$Label;

    const existingLabel = labelFixtures.get(id as string);
    if (!existingLabel) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Label not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    const response: gmail_v1.Schema$Label = {
      ...existingLabel,
      ...body,
    };

    return HttpResponse.json(response);
  }),

  /**
   * Delete label
   * DELETE /users/me/labels/:id
   */
  http.delete(`${GMAIL_BASE}/labels/:id`, ({ params }) => {
    const { id } = params;

    const label = labelFixtures.get(id as string);
    if (!label) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: `Label not found: ${id}`,
          },
        },
        { status: 404 }
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),
];

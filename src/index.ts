#!/usr/bin/env node
/**
 * GMCP Server
 *
 * MCP server for Gmail and Google Calendar APIs with OAuth2 authentication.
 * Provides tools to search and interact with Gmail messages and Calendar events.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAuthenticatedClient, getEnvConfig } from "@/auth.ts";
import { createCalendarClient } from "@/calendar.ts";
import { createGmailClient } from "@/gmail.ts";
import { createLogger } from "@/logger.ts";
import type { ToolDefinition } from "@/tool-registry.ts";
import {
  DESTRUCTIVE_ANNOTATIONS,
  MODIFY_ANNOTATIONS,
  READ_ONLY_ANNOTATIONS,
  registerTools,
  SEND_ANNOTATIONS,
} from "@/tool-registry.ts";
import {
  ARCHIVE_EMAIL_DESCRIPTION,
  ArchiveEmailInputSchema,
  archiveEmailTool,
} from "@/tools/archive-email.ts";
import {
  BATCH_MODIFY_DESCRIPTION,
  BatchModifyInputSchema,
  batchModifyTool,
} from "@/tools/batch-modify.ts";
import {
  CALENDAR_CREATE_EVENT_DESCRIPTION,
  CalendarCreateEventInputSchema,
  calendarCreateEventTool,
} from "@/tools/calendar-create.ts";
import {
  CALENDAR_EVENTS_DESCRIPTION,
  CalendarEventsInputSchema,
  calendarEventsTool,
} from "@/tools/calendar-events.ts";
import {
  CALENDAR_GET_EVENT_DESCRIPTION,
  CalendarGetEventInputSchema,
  calendarGetEventTool,
} from "@/tools/calendar-get-event.ts";
import {
  CALENDAR_LIST_DESCRIPTION,
  CalendarListInputSchema,
  calendarListTool,
} from "@/tools/calendar-list.ts";
import {
  CREATE_DRAFT_DESCRIPTION,
  CreateDraftInputSchema,
  createDraftTool,
} from "@/tools/create-draft.ts";
import {
  CREATE_LABEL_DESCRIPTION,
  CreateLabelInputSchema,
  createLabelTool,
} from "@/tools/create-label.ts";
import {
  DELETE_EMAIL_DESCRIPTION,
  DeleteEmailInputSchema,
  deleteEmailTool,
} from "@/tools/delete-email.ts";
import {
  DELETE_LABEL_DESCRIPTION,
  DeleteLabelInputSchema,
  deleteLabelTool,
} from "@/tools/delete-label.ts";
import {
  GET_ATTACHMENT_DESCRIPTION,
  GetAttachmentInputSchema,
  getAttachmentTool,
} from "@/tools/get-attachment.ts";
import {
  GET_EMAIL_DESCRIPTION,
  GetEmailInputSchema,
  getEmailTool,
} from "@/tools/get-email.ts";
import {
  GET_LABEL_DESCRIPTION,
  GetLabelInputSchema,
  getLabelTool,
} from "@/tools/get-label.ts";
import {
  GET_THREAD_DESCRIPTION,
  GetThreadInputSchema,
  getThreadTool,
} from "@/tools/get-thread.ts";
import {
  LIST_ATTACHMENTS_DESCRIPTION,
  ListAttachmentsInputSchema,
  listAttachmentsTool,
} from "@/tools/list-attachments.ts";
import {
  LIST_LABELS_DESCRIPTION,
  ListLabelsInputSchema,
  listLabelsTool,
} from "@/tools/list-labels.ts";
import {
  MODIFY_LABELS_DESCRIPTION,
  ModifyLabelsInputSchema,
  modifyLabelsTool,
} from "@/tools/modify-labels.ts";
import {
  REPLY_DESCRIPTION,
  ReplyInputSchema,
  replyTool,
} from "@/tools/reply.ts";
import {
  SEARCH_EMAILS_DESCRIPTION,
  SearchEmailsInputSchema,
  searchEmailsTool,
} from "@/tools/search.ts";
import {
  SEND_EMAIL_DESCRIPTION,
  SendEmailInputSchema,
  sendEmailTool,
} from "@/tools/send-email.ts";
import {
  UPDATE_LABEL_DESCRIPTION,
  UpdateLabelInputSchema,
  updateLabelTool,
} from "@/tools/update-label.ts";
import { getVersion } from "@/version.ts";

/**
 * Type aliases for tool definitions with proper client types
 */
type GmailToolDefinition = ToolDefinition<
  unknown,
  ReturnType<typeof createGmailClient>
>;
type CalendarToolDefinition = ToolDefinition<
  unknown,
  ReturnType<typeof createCalendarClient>
>;

/**
 * Main server initialization
 */
export async function startServer(): Promise<void> {
  const logger = createLogger();
  const version = await getVersion();

  logger.info({ version }, "GMCP Server starting");

  const { credentialsPath, tokenPath, scopes } = getEnvConfig();

  logger.info(
    {
      credentialsPath,
      tokenPath,
      scopeCount: scopes.length,
      scopes,
    },
    "Environment configuration loaded"
  );

  logger.info("Authenticating with Google APIs");
  const oauth2Client = await createAuthenticatedClient(
    credentialsPath,
    tokenPath,
    logger
  );

  const gmailClient = createGmailClient(oauth2Client, logger);
  const calendarClient = createCalendarClient(oauth2Client, logger);

  logger.info("Gmail and Calendar clients initialized");

  const server = new McpServer({
    name: "gmcp-server",
    version,
  });

  const tools = [
    {
      name: "gmcp_gmail_search_emails",
      title: "Search Gmail Emails",
      description: SEARCH_EMAILS_DESCRIPTION,
      inputSchema: SearchEmailsInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
      handler: searchEmailsTool,
    },
    {
      name: "gmcp_gmail_get_email",
      title: "Get Gmail Email",
      description: GET_EMAIL_DESCRIPTION,
      inputSchema: GetEmailInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
      handler: getEmailTool,
    },
    {
      name: "gmcp_gmail_get_thread",
      title: "Get Gmail Thread",
      description: GET_THREAD_DESCRIPTION,
      inputSchema: GetThreadInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
      handler: getThreadTool,
    },
    {
      name: "gmcp_gmail_list_attachments",
      title: "List Gmail Attachments",
      description: LIST_ATTACHMENTS_DESCRIPTION,
      inputSchema: ListAttachmentsInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
      handler: listAttachmentsTool,
    },
    {
      name: "gmcp_gmail_get_attachment",
      title: "Get Gmail Attachment",
      description: GET_ATTACHMENT_DESCRIPTION,
      inputSchema: GetAttachmentInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
      handler: getAttachmentTool,
    },
    {
      name: "gmcp_gmail_modify_labels",
      title: "Modify Gmail Labels",
      description: MODIFY_LABELS_DESCRIPTION,
      inputSchema: ModifyLabelsInputSchema,
      annotations: MODIFY_ANNOTATIONS,
      handler: modifyLabelsTool,
    },
    {
      name: "gmcp_gmail_batch_modify",
      title: "Batch Modify Gmail Labels",
      description: BATCH_MODIFY_DESCRIPTION,
      inputSchema: BatchModifyInputSchema,
      annotations: MODIFY_ANNOTATIONS,
      handler: batchModifyTool,
    },
    {
      name: "gmcp_gmail_send_email",
      title: "Send Gmail Email",
      description: SEND_EMAIL_DESCRIPTION,
      inputSchema: SendEmailInputSchema,
      annotations: SEND_ANNOTATIONS,
      handler: sendEmailTool,
    },
    {
      name: "gmcp_gmail_reply",
      title: "Reply to Gmail Email",
      description: REPLY_DESCRIPTION,
      inputSchema: ReplyInputSchema,
      annotations: SEND_ANNOTATIONS,
      handler: replyTool,
    },
    {
      name: "gmcp_gmail_create_draft",
      title: "Create Gmail Draft",
      description: CREATE_DRAFT_DESCRIPTION,
      inputSchema: CreateDraftInputSchema,
      annotations: SEND_ANNOTATIONS,
      handler: createDraftTool,
    },
    {
      name: "gmcp_gmail_list_labels",
      title: "List Gmail Labels",
      description: LIST_LABELS_DESCRIPTION,
      inputSchema: ListLabelsInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
      handler: listLabelsTool,
    },
    {
      name: "gmcp_gmail_get_label",
      title: "Get Gmail Label",
      description: GET_LABEL_DESCRIPTION,
      inputSchema: GetLabelInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
      handler: getLabelTool,
    },
    {
      name: "gmcp_gmail_create_label",
      title: "Create Gmail Label",
      description: CREATE_LABEL_DESCRIPTION,
      inputSchema: CreateLabelInputSchema,
      annotations: MODIFY_ANNOTATIONS,
      handler: createLabelTool,
    },
    {
      name: "gmcp_gmail_update_label",
      title: "Update Gmail Label",
      description: UPDATE_LABEL_DESCRIPTION,
      inputSchema: UpdateLabelInputSchema,
      annotations: MODIFY_ANNOTATIONS,
      handler: updateLabelTool,
    },
    {
      name: "gmcp_gmail_delete_label",
      title: "Delete Gmail Label",
      description: DELETE_LABEL_DESCRIPTION,
      inputSchema: DeleteLabelInputSchema,
      annotations: DESTRUCTIVE_ANNOTATIONS,
      handler: deleteLabelTool,
    },
    {
      name: "gmcp_gmail_delete_email",
      title: "Delete Gmail Email",
      description: DELETE_EMAIL_DESCRIPTION,
      inputSchema: DeleteEmailInputSchema,
      annotations: DESTRUCTIVE_ANNOTATIONS,
      handler: deleteEmailTool,
    },
    {
      name: "gmcp_gmail_archive_email",
      title: "Archive Gmail Email",
      description: ARCHIVE_EMAIL_DESCRIPTION,
      inputSchema: ArchiveEmailInputSchema,
      annotations: MODIFY_ANNOTATIONS,
      handler: archiveEmailTool,
    },
  ] as GmailToolDefinition[];

  const calendarTools = [
    {
      name: "gmcp_calendar_list_calendars",
      title: "List Google Calendars",
      description: CALENDAR_LIST_DESCRIPTION,
      inputSchema: CalendarListInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
      handler: calendarListTool,
    },
    {
      name: "gmcp_calendar_list_events",
      title: "List Calendar Events",
      description: CALENDAR_EVENTS_DESCRIPTION,
      inputSchema: CalendarEventsInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
      handler: calendarEventsTool,
    },
    {
      name: "gmcp_calendar_get_event",
      title: "Get Calendar Event",
      description: CALENDAR_GET_EVENT_DESCRIPTION,
      inputSchema: CalendarGetEventInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
      handler: calendarGetEventTool,
    },
    {
      name: "gmcp_calendar_create_event",
      title: "Create Calendar Event",
      description: CALENDAR_CREATE_EVENT_DESCRIPTION,
      inputSchema: CalendarCreateEventInputSchema,
      annotations: SEND_ANNOTATIONS,
      handler: calendarCreateEventTool,
    },
  ] as CalendarToolDefinition[];

  registerTools(server, gmailClient, tools, logger);
  registerTools(server, calendarClient, calendarTools, logger);

  const totalTools = tools.length + calendarTools.length;
  logger.info(
    {
      gmailTools: tools.length,
      calendarTools: calendarTools.length,
      totalTools,
    },
    "Tools registered"
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("MCP server connected via stdio");
  logger.info("Ready to accept requests");
}

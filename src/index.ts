#!/usr/bin/env bun
/**
 * GMCP Server
 *
 * MCP server for Gmail API with OAuth2 authentication.
 * Provides tools to search and interact with Gmail messages.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAuthenticatedClient, getEnvConfig } from "@/auth.ts";
import { GmailClient } from "@/gmail.ts";
import {
  MODIFY_ANNOTATIONS,
  READ_ONLY_ANNOTATIONS,
  registerTools,
  SEND_ANNOTATIONS,
} from "@/tool-registry.ts";
import {
  BATCH_MODIFY_DESCRIPTION,
  BatchModifyInputSchema,
  batchModifyTool,
} from "@/tools/batch-modify.ts";
import {
  CREATE_DRAFT_DESCRIPTION,
  CreateDraftInputSchema,
  createDraftTool,
} from "@/tools/create-draft.ts";
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

/**
 * Main server initialization
 */
async function main() {
  console.error("GMCP Server - Starting...");

  const { credentialsPath, tokenPath, scopes } = getEnvConfig();

  console.error(`Credentials: ${credentialsPath}`);
  console.error(`Token: ${tokenPath}`);
  console.error(`Scopes: ${scopes.join(", ")}`);

  console.error("Authenticating with Gmail API...");
  const oauth2Client = await createAuthenticatedClient(
    credentialsPath,
    tokenPath
  );

  const gmailClient = new GmailClient(oauth2Client);

  console.error("Gmail client initialized");

  const server = new McpServer({
    name: "gmcp-server",
    version: "1.0.0",
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
  ];

  registerTools(server, gmailClient, tools);

  console.error(`Tools registered (${tools.length} total)`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("MCP server connected via stdio");
  console.error("Ready to accept requests");
}

main().catch((error) => {
  console.error("Fatal error:");
  console.error(error);
  process.exit(1);
});

/**
 * TypeScript type definitions for GMCP Server
 */

import type { gmail_v1 } from "googleapis";
import { z } from "zod";

/**
 * OAuth2 credentials from Google Console (Desktop Application)
 */
export interface OAuth2Credentials {
  installed: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

/**
 * Zod schema for OAuth2 credentials validation
 */
export const OAuth2CredentialsSchema = z.object({
  installed: z.object({
    client_id: z.string().min(1, "client_id is required"),
    project_id: z.string().min(1, "project_id is required"),
    auth_uri: z.string().url("auth_uri must be a valid URL"),
    token_uri: z.string().url("token_uri must be a valid URL"),
    auth_provider_x509_cert_url: z
      .string()
      .url("auth_provider_x509_cert_url must be a valid URL"),
    client_secret: z.string().min(1, "client_secret is required"),
    redirect_uris: z.array(
      z.string().url("redirect_uris must contain valid URLs")
    ),
  }),
});

/**
 * Stored OAuth2 tokens
 */
export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

/**
 * Zod schema for stored tokens validation
 */
export const StoredTokensSchema = z.object({
  access_token: z.string().min(1, "access_token is required"),
  refresh_token: z.string().min(1, "refresh_token is required"),
  scope: z.string().min(1, "scope is required"),
  token_type: z.string().min(1, "token_type is required"),
  expiry_date: z
    .number()
    .int()
    .positive("expiry_date must be a positive integer"),
});

/**
 * Email message structure for MCP responses
 */
export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
  labels?: string[];
}

/**
 * Gmail search result
 */
export interface GmailSearchResult {
  emails: EmailMessage[];
  total_estimate: number;
  has_more: boolean;
  next_page_token?: string;
}

/**
 * Gmail label structure
 */
export interface GmailLabel {
  id: string;
  name: string;
  type: "system" | "user";
  messageListVisibility?: "show" | "hide";
  labelListVisibility?: "labelShow" | "labelShowIfUnread" | "labelHide";
  messagesTotal?: number;
  messagesUnread?: number;
  color?: { textColor: string; backgroundColor: string };
}

/**
 * Gmail attachment information
 */
export interface AttachmentInfo {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

/**
 * Result from sending an email
 */
export interface SendResult {
  id: string;
  threadId: string;
  labelIds?: string[];
}

/**
 * Result from creating a draft
 */
export interface DraftResult {
  id: string;
  message: {
    id: string;
    threadId: string;
  };
}

/**
 * Default Gmail scope (readonly access)
 */
const DEFAULT_GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

/**
 * Gmail scope mapping (short name to full URL)
 */
export const GMAIL_SCOPE_MAP: Record<string, string> = {
  "gmail.readonly": DEFAULT_GMAIL_SCOPE,
  "gmail.modify": "https://www.googleapis.com/auth/gmail.modify",
  "gmail.send": "https://www.googleapis.com/auth/gmail.send",
  "gmail.labels": "https://www.googleapis.com/auth/gmail.labels",
  "gmail.metadata": "https://www.googleapis.com/auth/gmail.metadata",
  "gmail.compose": "https://www.googleapis.com/auth/gmail.compose",
  "gmail.insert": "https://www.googleapis.com/auth/gmail.insert",
  "gmail.settings.basic":
    "https://www.googleapis.com/auth/gmail.settings.basic",
  "gmail.settings.sharing":
    "https://www.googleapis.com/auth/gmail.settings.sharing",
};

/**
 * Parse scopes from environment variable
 * Supports both short names (gmail.readonly) and full URLs
 */
export function parseScopes(scopesEnv?: string): string[] {
  if (!scopesEnv) {
    return [DEFAULT_GMAIL_SCOPE];
  }

  return scopesEnv.split(",").map((scope) => {
    const trimmed = scope.trim();
    // If it's a short name, map it
    if (GMAIL_SCOPE_MAP[trimmed]) {
      return GMAIL_SCOPE_MAP[trimmed];
    }
    // Otherwise, assume it's a full URL
    return trimmed;
  });
}

/**
 * Extract email header value
 */
export function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string {
  if (!headers) {
    return "";
  }
  const header = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value || "";
}

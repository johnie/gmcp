/**
 * TypeScript type definitions for GMCP Server
 */

import type { gmail_v1 } from "googleapis";

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

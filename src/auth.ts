/**
 * OAuth2 authentication module for GMCP Server
 */

import { OAuth2Client } from "google-auth-library";
import type { Logger } from "pino";
import { AuthError, ConfigurationError } from "@/errors.ts";
import type { OAuth2Credentials, StoredTokens } from "@/types.ts";
import {
  OAuth2CredentialsSchema,
  parseScopes,
  StoredTokensSchema,
} from "@/types.ts";

/**
 * Load OAuth2 credentials from file
 */
export async function loadCredentials(
  path: string
): Promise<OAuth2Credentials> {
  try {
    const file = Bun.file(path);
    const content = await file.text();
    const parsed = JSON.parse(content);
    return OAuth2CredentialsSchema.parse(parsed);
  } catch (error) {
    throw new AuthError(
      "AUTH_CREDENTIAL_LOAD_FAILED",
      `Failed to load credentials from ${path}: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Load stored tokens from file
 */
export async function loadTokens(
  path: string,
  logger?: Logger
): Promise<StoredTokens | null> {
  try {
    const file = Bun.file(path);
    const exists = await file.exists();
    if (!exists) {
      return null;
    }
    const content = await file.text();
    const parsed = JSON.parse(content);
    return StoredTokensSchema.parse(parsed);
  } catch (error) {
    logger?.warn(
      {
        path,
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to load tokens"
    );
    return null;
  }
}

/**
 * Save tokens to file
 */
export async function saveTokens(
  path: string,
  tokens: StoredTokens
): Promise<void> {
  try {
    await Bun.write(path, JSON.stringify(tokens, null, 2));
  } catch (error) {
    throw new AuthError(
      "AUTH_TOKEN_SAVE_FAILED",
      `Failed to save tokens to ${path}: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Create OAuth2 client from credentials
 * @param credentials - OAuth2 credentials from Google Cloud Console
 * @param redirectUriOverride - Optional override for redirect URI (useful for local callback server)
 */
export function createOAuth2Client(
  credentials: OAuth2Credentials,
  redirectUriOverride?: string
): OAuth2Client {
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const redirectUri = redirectUriOverride ?? redirect_uris[0];
  return new OAuth2Client(client_id, client_secret, redirectUri);
}

/**
 * Generate authorization URL
 */
export function getAuthUrl(
  oauth2Client: OAuth2Client,
  scopes: string[]
): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(
  oauth2Client: OAuth2Client,
  code: string
): Promise<StoredTokens> {
  const { tokens } = await oauth2Client.getToken(code);

  if (!(tokens.access_token && tokens.refresh_token)) {
    throw new AuthError(
      "AUTH_TOKEN_INVALID",
      "Failed to obtain access_token or refresh_token from OAuth2 code exchange"
    );
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope || "",
    token_type: tokens.token_type || "Bearer",
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
  };
}

/**
 * Create authenticated OAuth2 client from stored tokens
 */
export async function createAuthenticatedClient(
  credentialsPath: string,
  tokenPath: string,
  logger?: Logger
): Promise<OAuth2Client> {
  const credentials = await loadCredentials(credentialsPath);
  const oauth2Client = createOAuth2Client(credentials);

  const tokens = await loadTokens(tokenPath, logger);
  if (!tokens) {
    throw new AuthError(
      "AUTH_TOKEN_MISSING",
      `No tokens found at ${tokenPath}. Please run 'bun run auth' to authenticate first.`
    );
  }

  oauth2Client.setCredentials(tokens);

  oauth2Client.on("tokens", async (newTokens) => {
    const updatedTokens: StoredTokens = {
      ...tokens,
      access_token: newTokens.access_token || tokens.access_token,
      expiry_date: newTokens.expiry_date || tokens.expiry_date,
    };
    if (newTokens.refresh_token) {
      updatedTokens.refresh_token = newTokens.refresh_token;
    }

    logger?.info(
      {
        expiry_date: updatedTokens.expiry_date,
        has_refresh_token: !!updatedTokens.refresh_token,
      },
      "Tokens refreshed"
    );

    await saveTokens(tokenPath, updatedTokens);
  });

  return oauth2Client;
}

/**
 * Get environment variable configuration
 */
export function getEnvConfig() {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
  const tokenPath = process.env.GOOGLE_TOKEN_PATH;
  const scopesEnv = process.env.GOOGLE_SCOPES;

  if (!credentialsPath) {
    throw new ConfigurationError(
      "CONFIG_MISSING_ENV",
      "GOOGLE_CREDENTIALS_PATH environment variable is required"
    );
  }

  if (!tokenPath) {
    throw new ConfigurationError(
      "CONFIG_MISSING_ENV",
      "GOOGLE_TOKEN_PATH environment variable is required"
    );
  }

  const scopes = parseScopes(scopesEnv);

  return { credentialsPath, tokenPath, scopes };
}

/**
 * Default port for local OAuth callback server
 */
const DEFAULT_OAUTH_PORT = 3000;

/**
 * Regex to match trailing slash
 */
const TRAILING_SLASH_REGEX = /\/$/;

/**
 * Normalize redirect URI to ensure it has an explicit port.
 * Google OAuth for desktop apps allows any port on localhost.
 * @param redirectUri - The redirect URI (e.g., "http://localhost" or "http://localhost:8080")
 * @returns Object with normalized URI and port
 */
export function normalizeRedirectUri(redirectUri: string): {
  uri: string;
  port: number;
} {
  try {
    const url = new URL(redirectUri);

    // If port is explicitly specified, use it as-is
    if (url.port) {
      return {
        uri: redirectUri,
        port: Number.parseInt(url.port, 10),
      };
    }

    // No port specified - add our default port for localhost/loopback
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      url.port = String(DEFAULT_OAUTH_PORT);
      return {
        uri: url.toString().replace(TRAILING_SLASH_REGEX, ""),
        port: DEFAULT_OAUTH_PORT,
      };
    }

    // Non-localhost URI - use as-is with protocol default port
    return {
      uri: redirectUri,
      port: url.protocol === "https:" ? 443 : 80,
    };
  } catch {
    return {
      uri: `http://localhost:${DEFAULT_OAUTH_PORT}`,
      port: DEFAULT_OAUTH_PORT,
    };
  }
}

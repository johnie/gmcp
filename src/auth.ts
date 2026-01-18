/**
 * OAuth2 authentication module for Gmail MCP Server
 */

import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { OAuth2Credentials, StoredTokens } from './types.ts';
import { parseScopes } from './types.ts';

/**
 * Load OAuth2 credentials from file
 */
export async function loadCredentials(path: string): Promise<OAuth2Credentials> {
  try {
    const file = Bun.file(path);
    const content = await file.text();
    return JSON.parse(content) as OAuth2Credentials;
  } catch (error) {
    throw new Error(`Failed to load credentials from ${path}: ${error}`);
  }
}

/**
 * Load stored tokens from file
 */
export async function loadTokens(path: string): Promise<StoredTokens | null> {
  try {
    const file = Bun.file(path);
    const exists = await file.exists();
    if (!exists) {
      return null;
    }
    const content = await file.text();
    return JSON.parse(content) as StoredTokens;
  } catch (error) {
    console.error(`Failed to load tokens from ${path}: ${error}`);
    return null;
  }
}

/**
 * Save tokens to file
 */
export async function saveTokens(path: string, tokens: StoredTokens): Promise<void> {
  try {
    await Bun.write(path, JSON.stringify(tokens, null, 2));
  } catch (error) {
    throw new Error(`Failed to save tokens to ${path}: ${error}`);
  }
}

/**
 * Create OAuth2 client from credentials
 */
export function createOAuth2Client(credentials: OAuth2Credentials): OAuth2Client {
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

/**
 * Generate authorization URL
 */
export function getAuthUrl(oauth2Client: OAuth2Client, scopes: string[]): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent to ensure we get refresh_token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(oauth2Client: OAuth2Client, code: string): Promise<StoredTokens> {
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain access_token or refresh_token');
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope || '',
    token_type: tokens.token_type || 'Bearer',
    expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
  };
}

/**
 * Create authenticated OAuth2 client from stored tokens
 */
export async function createAuthenticatedClient(
  credentialsPath: string,
  tokenPath: string
): Promise<OAuth2Client> {
  // Load credentials
  const credentials = await loadCredentials(credentialsPath);
  const oauth2Client = createOAuth2Client(credentials);

  // Load tokens
  const tokens = await loadTokens(tokenPath);
  if (!tokens) {
    throw new Error(
      `No tokens found at ${tokenPath}. Please run 'bun run auth' to authenticate first.`
    );
  }

  // Set credentials
  oauth2Client.setCredentials(tokens);

  // Set up token refresh handler
  oauth2Client.on('tokens', async (newTokens) => {
    console.error('Tokens refreshed');
    const updatedTokens: StoredTokens = {
      ...tokens,
      access_token: newTokens.access_token || tokens.access_token,
      expiry_date: newTokens.expiry_date || tokens.expiry_date,
    };
    if (newTokens.refresh_token) {
      updatedTokens.refresh_token = newTokens.refresh_token;
    }
    await saveTokens(tokenPath, updatedTokens);
  });

  return oauth2Client;
}

/**
 * Get environment variable configuration
 */
export function getEnvConfig() {
  const credentialsPath = process.env.GMAIL_CREDENTIALS_PATH;
  const tokenPath = process.env.GMAIL_TOKEN_PATH;
  const scopesEnv = process.env.GMAIL_SCOPES;

  if (!credentialsPath) {
    throw new Error('GMAIL_CREDENTIALS_PATH environment variable is required');
  }

  if (!tokenPath) {
    throw new Error('GMAIL_TOKEN_PATH environment variable is required');
  }

  const scopes = parseScopes(scopesEnv);

  return { credentialsPath, tokenPath, scopes };
}

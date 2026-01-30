#!/usr/bin/env node
/**
 * OAuth2 CLI for GMCP Server
 * Run this to authenticate and save tokens: bun run auth
 */

import { input } from "@inquirer/prompts";
import kleur from "kleur";
import {
  createOAuth2Client,
  getAuthUrl,
  getEnvConfig,
  getTokensFromCode,
  loadCredentials,
  normalizeRedirectUri,
  saveTokens,
} from "@/auth.ts";

const AUTH_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

const ICONS = {
  success: '<polyline points="20 6 9 17 4 12"></polyline>',
  error:
    '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
} as const;

interface AuthPageConfig {
  title: string;
  icon: "success" | "error";
  heading: string;
  message: string;
  errorCode?: string;
}

function getAuthPageHtml(config: AuthPageConfig): string {
  const errorCodeHtml = config.errorCode
    ? `<p class="error-code">Error: ${config.errorCode}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GMCP - ${config.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #050505;
      color: #f9f9f9;
    }
    .container {
      text-align: center;
      padding: 3rem 4rem;
      max-width: 500px;
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem;
      border: 2px solid #f9f9f9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg {
      width: 32px;
      height: 32px;
      fill: none;
      stroke: #f9f9f9;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .brand {
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      margin-bottom: 1.5rem;
      color: #f9f9f9;
    }
    h1 {
      color: #f9f9f9;
      margin-bottom: 0.75rem;
      font-size: 1.25rem;
      font-weight: 500;
    }
    p {
      color: #888;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    .error-code {
      color: #666;
      font-size: 0.75rem;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg viewBox="0 0 24 24">${ICONS[config.icon]}</svg>
    </div>
    <div class="brand">GMCP</div>
    <h1>${config.heading}</h1>
    <p>${config.message}</p>
    ${errorCodeHtml}
  </div>
</body>
</html>`;
}

function getSuccessHtml(): string {
  return getAuthPageHtml({
    title: "Authentication Successful",
    icon: "success",
    heading: "Authentication Successful",
    message: "You can close this tab and return to your terminal.",
  });
}

function getErrorHtml(error: string, description?: string): string {
  return getAuthPageHtml({
    title: "Authentication Failed",
    icon: "error",
    heading: "Authentication Failed",
    message: description || "An error occurred during authentication.",
    errorCode: error,
  });
}

/**
 * Open URL in default browser
 */
async function openBrowser(url: string): Promise<boolean> {
  const platform = process.platform;
  let command: string[];

  if (platform === "darwin") {
    command = ["open", url];
  } else if (platform === "win32") {
    command = ["cmd", "/c", "start", "", url];
  } else {
    command = ["xdg-open", url];
  }

  try {
    const proc = Bun.spawn(command, {
      stdout: "ignore",
      stderr: "ignore",
    });
    await proc.exited;
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Check if running in headless environment
 */
function isHeadless(): boolean {
  return !process.stdout.isTTY || !!process.env.CI || !!process.env.SSH_CLIENT;
}

type AuthResult =
  | { success: true; code: string }
  | { success: false; error: string; description?: string };

/**
 * Start local OAuth callback server and wait for authorization code
 */
function waitForAuthCallback(
  port: number,
  redirectPath: string
): Promise<AuthResult> {
  return new Promise((resolve) => {
    let resolved = false;
    let timeoutId: Timer | undefined;

    const server = Bun.serve({
      port,
      fetch(req) {
        const url = new URL(req.url);

        if (url.pathname !== redirectPath && url.pathname !== "/") {
          return new Response("Not found", { status: 404 });
        }

        const error = url.searchParams.get("error");
        if (error) {
          const description = url.searchParams.get("error_description");
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            setImmediate(() => server.stop());
            resolve({
              success: false,
              error,
              description: description || undefined,
            });
          }
          return new Response(getErrorHtml(error, description || undefined), {
            headers: { "Content-Type": "text/html" },
          });
        }

        const code = url.searchParams.get("code");
        if (code) {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            setImmediate(() => server.stop());
            resolve({ success: true, code });
          }
          return new Response(getSuccessHtml(), {
            headers: { "Content-Type": "text/html" },
          });
        }

        return new Response("Waiting for authorization...", {
          headers: { "Content-Type": "text/plain" },
        });
      },
      error() {
        return new Response("Internal Server Error", { status: 500 });
      },
    });

    timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        server.stop();
        resolve({
          success: false,
          error: "timeout",
          description: "Authentication timed out after 2 minutes",
        });
      }
    }, AUTH_TIMEOUT_MS);

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        server.stop();
      }
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  });
}

/**
 * Run OAuth flow with local callback server (improved UX)
 */
async function runAuthWithServer(): Promise<void> {
  console.log(kleur.bold("GMCP Server - OAuth2 Authentication\n"));

  const { credentialsPath, tokenPath, scopes } = getEnvConfig();

  console.log(kleur.dim(`Credentials: ${credentialsPath}`));
  console.log(kleur.dim(`Tokens: ${tokenPath}`));
  console.log(kleur.dim(`Scopes: ${scopes.join(", ")}\n`));

  console.log(`${kleur.cyan("→")} Loading OAuth2 credentials...`);
  const credentials = await loadCredentials(credentialsPath);

  const rawRedirectUri = credentials.installed.redirect_uris[0] ?? "";
  const { uri: redirectUri, port } = normalizeRedirectUri(rawRedirectUri);
  const oauth2Client = createOAuth2Client(credentials, redirectUri);

  let redirectPath = "/";
  try {
    const parsedUri = new URL(redirectUri);
    redirectPath = parsedUri.pathname || "/";
  } catch {
    // Intentionally empty - keep default "/"
  }

  const authUrl = getAuthUrl(oauth2Client, scopes);

  console.log(`${kleur.cyan("→")} Starting local server on port ${port}...`);

  let serverPromise: Promise<AuthResult>;
  try {
    serverPromise = waitForAuthCallback(port, redirectPath);
  } catch (error) {
    console.error(kleur.red(`\nFailed to start local server on port ${port}.`));
    console.error(
      kleur.yellow(
        "The port may be in use. Check your credentials.json redirect_uri."
      )
    );
    console.error(kleur.dim("You can also try: bun run auth --manual\n"));
    throw error;
  }

  console.log(`${kleur.cyan("→")} Opening browser for authentication...\n`);

  const browserOpened = !isHeadless() && (await openBrowser(authUrl));

  if (!browserOpened) {
    console.log(kleur.yellow("Could not open browser automatically."));
    console.log(kleur.bold("Please open this URL in your browser:\n"));
  }

  console.log(`${kleur.cyan(authUrl)}\n`);

  console.log(kleur.dim("Waiting for authorization (timeout: 2 minutes)...\n"));

  const result = await serverPromise;

  if (!result.success) {
    if (result.error === "timeout") {
      console.error(kleur.red("\nAuthentication timed out."));
      console.error(kleur.dim("Please try again: bun run auth\n"));
    } else if (result.error === "access_denied") {
      console.error(kleur.red("\nAccess denied."));
      console.error(kleur.dim("You declined the authorization request.\n"));
    } else {
      console.error(kleur.red(`\nAuthentication failed: ${result.error}`));
      if (result.description) {
        console.error(kleur.dim(result.description));
      }
    }
    process.exit(1);
  }

  console.log(`${kleur.cyan("→")} Exchanging authorization code for tokens...`);

  try {
    const tokens = await getTokensFromCode(oauth2Client, result.code);
    await saveTokens(tokenPath, tokens);

    console.log(kleur.green("\n✓ Authentication successful!"));
    console.log(kleur.dim(`  Tokens saved to ${tokenPath}`));
    console.log(kleur.dim("\n  Run the MCP server with: npx gmcp\n"));
  } catch (error) {
    console.error(kleur.red("\nError exchanging code for tokens:"));
    console.error(error);
    process.exit(1);
  }
}

/**
 * Run OAuth flow with manual code input (fallback)
 */
async function runAuthManual(): Promise<void> {
  console.log(
    kleur.bold("GMCP Server - OAuth2 Authentication (Manual Mode)\n")
  );

  const { credentialsPath, tokenPath, scopes } = getEnvConfig();

  console.log(kleur.dim(`Credentials: ${credentialsPath}`));
  console.log(kleur.dim(`Tokens: ${tokenPath}`));
  console.log(kleur.dim(`Scopes: ${scopes.join(", ")}\n`));

  console.log(`${kleur.cyan("→")} Loading OAuth2 credentials...`);
  const credentials = await loadCredentials(credentialsPath);
  const oauth2Client = createOAuth2Client(credentials);

  const authUrl = getAuthUrl(oauth2Client, scopes);

  console.log(`\n${kleur.bold("Step 1:")} Visit this URL to authorize:`);
  console.log(kleur.cyan(authUrl));

  console.log(`\n${kleur.bold("Step 2:")} After authorizing:`);
  console.log(
    kleur.dim(
      'You will be redirected to localhost (may show "connection refused").'
    )
  );
  console.log(kleur.dim("Look at the URL in your browser's address bar."));
  console.log(kleur.dim("\nThe URL will look like:"));
  console.log(
    kleur.dim("  http://localhost:PORT/?code=YOUR_CODE_HERE&scope=...")
  );
  console.log(
    kleur.dim('\nCopy the entire code after "code=" (before "&scope")')
  );

  console.log(`\n${kleur.bold("Step 3:")} Paste the authorization code:\n`);

  const code = await input({
    message: "Authorization code:",
    required: true,
    validate: (value) => {
      if (value.length < 10) {
        return "Authorization code appears too short";
      }
      return true;
    },
  });

  console.log(
    `\n${kleur.cyan("→")} Exchanging authorization code for tokens...`
  );

  try {
    const tokens = await getTokensFromCode(oauth2Client, code);
    await saveTokens(tokenPath, tokens);

    console.log(kleur.green("\n✓ Authentication successful!"));
    console.log(kleur.dim(`  Tokens saved to ${tokenPath}`));
    console.log(kleur.dim("\n  Run the MCP server with: npx gmcp\n"));
  } catch (error) {
    console.error(kleur.red("\nError exchanging code for tokens:"));
    console.error(error);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
export async function runAuth(manualMode = false): Promise<void> {
  if (manualMode) {
    await runAuthManual();
  } else {
    await runAuthWithServer();
  }
}

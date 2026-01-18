#!/usr/bin/env bun
/**
 * OAuth2 CLI for GMCP Server
 * Run this to authenticate and save tokens: bun run auth
 */

import {
  createOAuth2Client,
  getAuthUrl,
  getEnvConfig,
  getTokensFromCode,
  loadCredentials,
  saveTokens,
} from "@/auth.ts";

async function main() {
  console.log("GMCP Server - OAuth2 Authentication\n");

  // Get configuration
  const { credentialsPath, tokenPath, scopes } = getEnvConfig();

  console.log(`Credentials file: ${credentialsPath}`);
  console.log(`Token file: ${tokenPath}`);
  console.log(`Scopes: ${scopes.join(", ")}\n`);

  // Load credentials
  console.log("Loading OAuth2 credentials...");
  const credentials = await loadCredentials(credentialsPath);
  const oauth2Client = createOAuth2Client(credentials);

  // Generate auth URL
  const authUrl = getAuthUrl(oauth2Client, scopes);

  console.log("\n========================================");
  console.log("STEP 1: Visit this URL to authorize:");
  console.log("========================================");
  console.log("\x1b[36m%s\x1b[0m", authUrl);
  console.log("\n========================================");
  console.log("STEP 2: After authorizing:");
  console.log("========================================");
  console.log(
    'You will be redirected to localhost (which will show "connection refused").'
  );
  console.log(
    "This is EXPECTED! Look at the URL in your browser's address bar."
  );
  console.log("\nThe URL will look like:");
  console.log("  http://localhost:PORT/?code=YOUR_CODE_HERE&scope=...");
  console.log(
    '\nCopy the entire code after "code=" (the long string before "&scope")'
  );
  console.log("\n========================================");
  console.log("STEP 3: Paste the authorization code below:");
  console.log("========================================");

  // Read from stdin
  const reader = Bun.stdin.stream().getReader();
  const decoder = new TextDecoder();
  let code = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(value);
    code += chunk;

    // Check if we have a complete line
    if (code.includes("\n")) {
      code = code.trim();
      break;
    }
  }

  if (!code) {
    console.error("Error: No authorization code provided");
    process.exit(1);
  }

  // Exchange code for tokens
  console.log("\nExchanging authorization code for tokens...");
  try {
    const tokens = await getTokensFromCode(oauth2Client, code);

    // Save tokens
    await saveTokens(tokenPath, tokens);

    console.log("\x1b[32m%s\x1b[0m", "\nSuccess! Tokens saved to", tokenPath);
    console.log("\nYou can now run the MCP server with: bun run start");
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "\nError exchanging code for tokens:");
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\x1b[31m%s\x1b[0m", "Fatal error:");
  console.error(error);
  process.exit(1);
});

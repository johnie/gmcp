#!/usr/bin/env node
/**
 * GMCP CLI - Unified entry point
 *
 * Usage:
 *   gmcp [command]
 *
 * Commands:
 *   start    Start the MCP server (default)
 *   auth     Run OAuth2 authentication flow
 *
 * Options:
 *   --help, -h       Show this help message
 *   --version, -v    Show version number
 */

import { getVersion } from "@/version.ts";

const USAGE = `
Usage: gmcp [command]

Commands:
  start    Start the MCP server (default)
  auth     Run OAuth2 authentication flow

Options:
  --help, -h       Show this help message
  --version, -v    Show version number

Examples:
  npx gmcp         Start the MCP server
  npx gmcp start   Start the MCP server
  npx gmcp auth    Run OAuth2 authentication
`.trim();

function showHelp() {
  console.log(USAGE);
}

async function showVersion() {
  const version = await getVersion();
  console.log(`gmcp v${version}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Handle flags
  if (command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  if (command === "--version" || command === "-v") {
    await showVersion();
    return;
  }

  // Handle commands
  if (!command || command === "start") {
    const { startServer } = await import("@/index.ts");
    await startServer();
    return;
  }

  if (command === "auth") {
    const { runAuth } = await import("@/auth-cli.ts");
    await runAuth();
    return;
  }

  // Unknown command
  console.error(`Unknown command: ${command}\n`);
  showHelp();
  process.exit(1);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

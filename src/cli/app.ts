import { buildApplication, buildRouteMap } from "@stricli/core";
import { getVersion } from "@/version.ts";
import { authCommand } from "./commands/auth.ts";
import { startCommand } from "./commands/start.ts";

const routes = buildRouteMap({
  routes: {
    start: startCommand,
    auth: authCommand,
  },
  docs: { brief: "GMCP - Gmail and Calendar MCP Server" },
});

export async function createApp() {
  const version = await getVersion();
  return buildApplication(routes, {
    name: "gmcp",
    versionInfo: { currentVersion: version },
  });
}

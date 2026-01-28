import { buildCommand } from "@stricli/core";

export const startCommand = buildCommand({
  func: async () => {
    const { startServer } = await import("@/index.ts");
    await startServer();
  },
  parameters: {},
  docs: { brief: "Start the MCP server" },
});

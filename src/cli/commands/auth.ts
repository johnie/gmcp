import { buildCommand } from "@stricli/core";

export const authCommand = buildCommand({
  func: async () => {
    const { runAuth } = await import("@/auth-cli.ts");
    await runAuth();
  },
  parameters: {},
  docs: { brief: "Run OAuth2 authentication flow" },
});

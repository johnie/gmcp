import { buildCommand } from "@stricli/core";

interface AuthFlags {
  readonly manual: boolean;
}

export const authCommand = buildCommand<AuthFlags>({
  docs: { brief: "Run OAuth2 authentication flow" },
  parameters: {
    flags: {
      manual: {
        kind: "boolean",
        brief: "Use manual code input instead of local callback server",
        default: false,
      },
    },
    aliases: {
      m: "manual",
    },
  },
  async func(flags) {
    const { runAuth } = await import("@/auth-cli.ts");
    await runAuth(flags.manual);
  },
});

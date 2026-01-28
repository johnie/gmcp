import { chmod, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "bunup";

const binFiles = ["cli.js"];

async function addShebangs() {
  const shebang = "#!/usr/bin/env node\n";
  for (const file of binFiles) {
    const path = join("dist", file);
    const content = await readFile(path, "utf8");
    if (!content.startsWith("#!")) {
      await writeFile(path, shebang + content);
    }
    await chmod(path, 0o755);
  }
}

export default defineConfig({
  entry: ["src/cli.ts", "src/index.ts", "src/auth-cli.ts"],
  outDir: "dist",
  format: "esm",
  target: "node",
  dts: true,
  clean: true,
  external: [
    "@modelcontextprotocol/sdk",
    "googleapis",
    "json2md",
    "zod",
    "pino",
    "pino-pretty",
  ],
  minify: false,
  onSuccess: addShebangs,
});

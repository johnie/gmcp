import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

async function findPackageJson(startDir: string): Promise<string> {
  let dir = startDir;
  let prevDir = "";

  while (dir !== prevDir) {
    const candidate = join(dir, "package.json");
    try {
      const content = await readFile(candidate, "utf8");
      const pkg = JSON.parse(content) as { name?: string };
      if (pkg.name === "gmcp") {
        return candidate;
      }
    } catch {
      // File doesn't exist or isn't valid JSON, continue searching
    }
    prevDir = dir;
    dir = dirname(dir);
  }

  throw new Error("Could not find gmcp package.json");
}

export async function getVersion(): Promise<string> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const packagePath = await findPackageJson(__dirname);
  const content = await readFile(packagePath, "utf8");
  const pkg = JSON.parse(content) as { version: string };
  return pkg.version;
}

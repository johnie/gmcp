#!/usr/bin/env node
import { run } from "@stricli/core";
import { createApp } from "./cli/app.ts";

const app = await createApp();

// Default to "start" if no command given
const args = process.argv.slice(2);
const effectiveArgs = args.length === 0 ? ["start"] : args;

await run(app, effectiveArgs, { process });

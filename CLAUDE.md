# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimal Bun-based TypeScript project. The project uses Bun as the runtime and bundler.

## Commands

- **Run the project**: `bun run index.ts`
- **Install dependencies**: `bun install`
- **Run tests**: `bun test`
- **Type check**: Use the TypeScript compiler settings in `tsconfig.json` (strict mode enabled)

## Development

- Use Bun instead of Node.js: `bun <file>` instead of `node <file>`
- Use `bun test` instead of jest or vitest
- Use `bunx <package>` instead of `npx <package>`
- Bun automatically loads `.env` files (no need for dotenv package)

## TypeScript Configuration

The project uses strict TypeScript settings:
- `strict: true` with additional safety checks (`noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`)
- Module resolution is set to `bundler` mode with `allowImportingTsExtensions: true`
- JSX configured with `react-jsx` transform
- Target is `ESNext` with `Preserve` module format

## Bun APIs

When writing code, prefer Bun's built-in APIs:
- `Bun.file()` over `node:fs` for file operations
- `Bun.serve()` for HTTP servers (supports WebSockets and routing)
- `bun:sqlite` for SQLite databases
- `Bun.$` for shell commands

import type { Logger, LoggerOptions } from "pino";
import pino from "pino";

interface CreateLoggerOptions {
  level?: string;
  pretty?: boolean;
  name?: string;
}

export function createLogger(options: CreateLoggerOptions = {}): Logger {
  const level = options.level || process.env.LOG_LEVEL || "info";
  const pretty = options.pretty ?? process.env.LOG_PRETTY === "true";

  const pinoOptions: LoggerOptions = {
    level,
    name: options.name || "gmcp",
    // Use stderr to avoid interfering with MCP stdio protocol
    ...(pretty && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
          destination: 2, // stderr
        },
      },
    }),
  };

  if (!pretty) {
    return pino(pinoOptions, pino.destination(2));
  }

  return pino(pinoOptions);
}

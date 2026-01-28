/**
 * MSW setup for Vitest
 * This file is loaded via vitest.config.ts setupFiles
 */

import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./server.ts";

/**
 * Start MSW server before all tests
 * onUnhandledRequest: 'error' will fail tests if unhandled requests occur
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

/**
 * Reset handlers after each test to ensure clean state
 */
afterEach(() => {
  server.resetHandlers();
});

/**
 * Close MSW server after all tests
 */
afterAll(() => {
  server.close();
});

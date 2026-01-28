/**
 * MSW server configuration
 */

import { setupServer } from "msw/node";
import { calendarHandlers, gmailHandlers } from "./handlers/index.ts";

/**
 * MSW server with all handlers
 */
export const server = setupServer(...gmailHandlers, ...calendarHandlers);

/**
 * MSW utility functions for testing
 */

import { HttpResponse, http } from "msw";
import { server } from "./server.ts";

const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

/**
 * Google API error response structure
 */
interface GoogleApiError {
  error: {
    code: number;
    message: string;
    errors?: Array<{ domain: string; reason: string }>;
  };
}

/**
 * Create a Google API error response
 */
function createErrorResponse(
  code: number,
  message: string,
  reason?: string
): GoogleApiError {
  return {
    error: {
      code,
      message,
      errors: reason ? [{ domain: "global", reason }] : undefined,
    },
  };
}

/**
 * Override a Gmail endpoint to return an error
 */
export function mockGmailError(
  method: "get" | "post" | "delete" | "put" | "patch",
  path: string,
  statusCode: number,
  message: string,
  reason?: string
): void {
  const handler = http[method](`${GMAIL_BASE}${path}`, () =>
    HttpResponse.json(createErrorResponse(statusCode, message, reason), {
      status: statusCode,
    })
  );
  server.use(handler);
}

/**
 * Override a Calendar endpoint to return an error
 */
export function mockCalendarError(
  method: "get" | "post" | "delete" | "put" | "patch",
  path: string,
  statusCode: number,
  message: string,
  reason?: string
): void {
  const handler = http[method](`${CALENDAR_BASE}${path}`, () =>
    HttpResponse.json(createErrorResponse(statusCode, message, reason), {
      status: statusCode,
    })
  );
  server.use(handler);
}

/**
 * Common error scenarios
 */
export const errorScenarios = {
  /**
   * 401 Unauthorized - Invalid credentials
   */
  unauthorized: (message = "Invalid credentials") => ({
    statusCode: 401,
    message,
    reason: "authError",
  }),

  /**
   * 403 Forbidden - Insufficient permissions
   */
  forbidden: (message = "The user does not have sufficient permissions") => ({
    statusCode: 403,
    message,
    reason: "insufficientPermissions",
  }),

  /**
   * 404 Not Found - Resource not found
   */
  notFound: (resourceType = "Resource") => ({
    statusCode: 404,
    message: `${resourceType} not found`,
    reason: "notFound",
  }),

  /**
   * 429 Too Many Requests - Rate limited
   */
  rateLimited: (
    message = "Rate Limit Exceeded. User message quota exceeded."
  ) => ({
    statusCode: 429,
    message,
    reason: "rateLimitExceeded",
  }),

  /**
   * 500 Internal Server Error - Backend error
   */
  serverError: (message = "Internal server error") => ({
    statusCode: 500,
    message,
    reason: "backendError",
  }),
};

/**
 * Mock Gmail 401 Unauthorized
 */
export function mockGmailUnauthorized(): void {
  const error = errorScenarios.unauthorized();
  server.use(
    http.get(`${GMAIL_BASE}/*`, () =>
      HttpResponse.json(
        createErrorResponse(error.statusCode, error.message, error.reason),
        { status: error.statusCode }
      )
    ),
    http.post(`${GMAIL_BASE}/*`, () =>
      HttpResponse.json(
        createErrorResponse(error.statusCode, error.message, error.reason),
        { status: error.statusCode }
      )
    )
  );
}

/**
 * Mock Calendar 401 Unauthorized
 */
export function mockCalendarUnauthorized(): void {
  const error = errorScenarios.unauthorized();
  server.use(
    http.get(`${CALENDAR_BASE}/*`, () =>
      HttpResponse.json(
        createErrorResponse(error.statusCode, error.message, error.reason),
        { status: error.statusCode }
      )
    ),
    http.post(`${CALENDAR_BASE}/*`, () =>
      HttpResponse.json(
        createErrorResponse(error.statusCode, error.message, error.reason),
        { status: error.statusCode }
      )
    )
  );
}

/**
 * Mock Gmail rate limit (429)
 */
export function mockGmailRateLimited(): void {
  const error = errorScenarios.rateLimited();
  server.use(
    http.get(`${GMAIL_BASE}/*`, () =>
      HttpResponse.json(
        createErrorResponse(error.statusCode, error.message, error.reason),
        { status: error.statusCode }
      )
    ),
    http.post(`${GMAIL_BASE}/*`, () =>
      HttpResponse.json(
        createErrorResponse(error.statusCode, error.message, error.reason),
        { status: error.statusCode }
      )
    )
  );
}

/**
 * Mock Calendar rate limit (429)
 */
export function mockCalendarRateLimited(): void {
  const error = errorScenarios.rateLimited();
  server.use(
    http.get(`${CALENDAR_BASE}/*`, () =>
      HttpResponse.json(
        createErrorResponse(error.statusCode, error.message, error.reason),
        { status: error.statusCode }
      )
    ),
    http.post(`${CALENDAR_BASE}/*`, () =>
      HttpResponse.json(
        createErrorResponse(error.statusCode, error.message, error.reason),
        { status: error.statusCode }
      )
    )
  );
}

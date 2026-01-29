/**
 * Custom error classes for GMCP Server
 */

/**
 * Error codes for GMCP errors
 */
export type GmcpErrorCode =
  | "CONFIG_MISSING_ENV"
  | "CONFIG_INVALID"
  | "AUTH_TOKEN_MISSING"
  | "AUTH_TOKEN_INVALID"
  | "AUTH_CREDENTIAL_LOAD_FAILED"
  | "AUTH_TOKEN_SAVE_FAILED"
  | "GMAIL_API_ERROR"
  | "CALENDAR_API_ERROR";

/**
 * Base error class for GMCP errors
 */
export class GmcpError extends Error {
  readonly code: GmcpErrorCode;
  override readonly cause?: Error;

  constructor(code: GmcpErrorCode, message: string, cause?: Error) {
    super(message);
    this.name = "GmcpError";
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Configuration-related errors (missing/invalid environment variables, config files)
 */
export class ConfigurationError extends GmcpError {
  constructor(
    code: "CONFIG_MISSING_ENV" | "CONFIG_INVALID",
    message: string,
    cause?: Error
  ) {
    super(code, message, cause);
    this.name = "ConfigurationError";
  }
}

/**
 * Authentication-related errors (missing/invalid tokens, credential loading failures)
 */
export class AuthError extends GmcpError {
  constructor(
    code:
      | "AUTH_TOKEN_MISSING"
      | "AUTH_TOKEN_INVALID"
      | "AUTH_CREDENTIAL_LOAD_FAILED"
      | "AUTH_TOKEN_SAVE_FAILED",
    message: string,
    cause?: Error
  ) {
    super(code, message, cause);
    this.name = "AuthError";
  }
}

/**
 * Google API service type
 */
export type GoogleApiService = "gmail" | "calendar";

/**
 * Google API errors (Gmail and Calendar API failures)
 */
export class GoogleApiError extends GmcpError {
  readonly service: GoogleApiService;
  readonly operation: string;

  constructor(
    service: GoogleApiService,
    operation: string,
    message: string,
    cause?: Error
  ) {
    const code: GmcpErrorCode =
      service === "gmail" ? "GMAIL_API_ERROR" : "CALENDAR_API_ERROR";
    super(code, message, cause);
    this.name = "GoogleApiError";
    this.service = service;
    this.operation = operation;
  }
}

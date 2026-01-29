/**
 * Tests for type utilities
 */

import { describe, expect, it } from "vitest";
import { GMAIL_SCOPE_MAP, getHeader, parseScopes } from "@/types.ts";

describe("parseScopes", () => {
  it("returns default scope when undefined", () => {
    const result = parseScopes(undefined);
    expect(result).toEqual(["https://www.googleapis.com/auth/gmail.readonly"]);
  });

  it("returns default scope when empty string", () => {
    const result = parseScopes("");
    expect(result).toEqual(["https://www.googleapis.com/auth/gmail.readonly"]);
  });

  it("maps single short name to full URL", () => {
    const result = parseScopes("gmail.readonly");
    expect(result).toEqual(["https://www.googleapis.com/auth/gmail.readonly"]);
  });

  it("passes through full URL unchanged", () => {
    const fullUrl = "https://www.googleapis.com/auth/gmail.modify";
    const result = parseScopes(fullUrl);
    expect(result).toEqual([fullUrl]);
  });

  it("maps comma-separated multiple scopes", () => {
    const result = parseScopes("gmail.readonly,gmail.send");
    expect(result).toEqual([
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ]);
  });

  it("handles mixed short names and full URLs", () => {
    const fullUrl = "https://www.googleapis.com/auth/gmail.compose";
    const result = parseScopes(`gmail.readonly,${fullUrl}`);
    expect(result).toEqual([
      "https://www.googleapis.com/auth/gmail.readonly",
      fullUrl,
    ]);
  });

  it("trims whitespace around scopes", () => {
    const result = parseScopes(" gmail.readonly , gmail.send ");
    expect(result).toEqual([
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ]);
  });

  it("passes through unknown scope names", () => {
    const result = parseScopes("custom.scope");
    expect(result).toEqual(["custom.scope"]);
  });

  it("maps all known scope names", () => {
    for (const [shortName, fullUrl] of Object.entries(GMAIL_SCOPE_MAP)) {
      const result = parseScopes(shortName);
      expect(result).toEqual([fullUrl]);
    }
  });
});

describe("getHeader", () => {
  it("returns empty string when headers is undefined", () => {
    const result = getHeader(undefined, "Subject");
    expect(result).toBe("");
  });

  it("returns empty string when headers is empty array", () => {
    const result = getHeader([], "Subject");
    expect(result).toBe("");
  });

  it("returns empty string when header not found", () => {
    const headers = [{ name: "From", value: "test@example.com" }];
    const result = getHeader(headers, "Subject");
    expect(result).toBe("");
  });

  it("finds header with exact match", () => {
    const headers = [
      { name: "From", value: "sender@example.com" },
      { name: "Subject", value: "Test Subject" },
    ];
    const result = getHeader(headers, "Subject");
    expect(result).toBe("Test Subject");
  });

  it("finds header with case-insensitive match", () => {
    const headers = [
      { name: "content-type", value: "text/html" },
      { name: "Subject", value: "Test Subject" },
    ];
    const result = getHeader(headers, "CONTENT-TYPE");
    expect(result).toBe("text/html");
  });

  it("returns empty string when value is null", () => {
    const headers = [{ name: "Subject", value: null }];
    const result = getHeader(headers, "Subject");
    expect(result).toBe("");
  });

  it("returns empty string when value is undefined", () => {
    const headers = [{ name: "Subject", value: undefined }];
    const result = getHeader(headers, "Subject");
    expect(result).toBe("");
  });

  it("returns first match when multiple headers with same name", () => {
    const headers = [
      { name: "Received", value: "first" },
      { name: "Received", value: "second" },
    ];
    const result = getHeader(headers, "Received");
    expect(result).toBe("first");
  });
});

describe("parseScopes with calendar", () => {
  it("maps calendar readonly scope", () => {
    const result = parseScopes("calendar.readonly");
    expect(result).toEqual([
      "https://www.googleapis.com/auth/calendar.readonly",
    ]);
  });

  it("maps calendar events scope", () => {
    const result = parseScopes("calendar.events");
    expect(result).toEqual(["https://www.googleapis.com/auth/calendar.events"]);
  });

  it("maps full calendar scope", () => {
    const result = parseScopes("calendar");
    expect(result).toEqual(["https://www.googleapis.com/auth/calendar"]);
  });

  it("maps mixed gmail and calendar scopes", () => {
    const result = parseScopes("gmail.readonly,calendar.readonly");
    expect(result).toEqual([
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar.readonly",
    ]);
  });

  it("maps multiple calendar scopes", () => {
    const result = parseScopes(
      "calendar.readonly,calendar.events,calendar.calendarlist.readonly"
    );
    expect(result).toEqual([
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
    ]);
  });

  it("maps all known calendar scope names", () => {
    // Test all known calendar scopes
    const calendarScopes = {
      "calendar.readonly": "https://www.googleapis.com/auth/calendar.readonly",
      calendar: "https://www.googleapis.com/auth/calendar",
      "calendar.events": "https://www.googleapis.com/auth/calendar.events",
      "calendar.events.readonly":
        "https://www.googleapis.com/auth/calendar.events.readonly",
      "calendar.settings.readonly":
        "https://www.googleapis.com/auth/calendar.settings.readonly",
      "calendar.calendarlist.readonly":
        "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
      "calendar.calendarlist":
        "https://www.googleapis.com/auth/calendar.calendarlist",
    };
    for (const [shortName, fullUrl] of Object.entries(calendarScopes)) {
      const result = parseScopes(shortName);
      expect(result).toEqual([fullUrl]);
    }
  });
});

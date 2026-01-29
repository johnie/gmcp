/**
 * Tests for Calendar helper functions
 */

import { describe, expect, it } from "vitest";
import { isAllDayDate, parseCalendar, parseEvent } from "@/calendar.ts";

describe("parseCalendar", () => {
  it("parses calendar with all fields", () => {
    const calendar = {
      id: "cal123",
      summary: "My Calendar",
      description: "Personal calendar",
      timeZone: "America/New_York",
      primary: true,
      backgroundColor: "#ff0000",
      foregroundColor: "#ffffff",
      accessRole: "owner",
    };

    const result = parseCalendar(calendar);

    expect(result).toEqual({
      id: "cal123",
      summary: "My Calendar",
      description: "Personal calendar",
      timeZone: "America/New_York",
      primary: true,
      backgroundColor: "#ff0000",
      foregroundColor: "#ffffff",
      accessRole: "owner",
    });
  });

  it("parses calendar with minimal fields", () => {
    const calendar = {
      id: "cal456",
      summary: "Work Calendar",
    };

    const result = parseCalendar(calendar);

    expect(result).toEqual({
      id: "cal456",
      summary: "Work Calendar",
      description: undefined,
      timeZone: undefined,
      primary: undefined,
      backgroundColor: undefined,
      foregroundColor: undefined,
      accessRole: undefined,
    });
  });

  it("handles missing id and summary with empty strings", () => {
    const calendar = {};

    const result = parseCalendar(calendar);

    expect(result.id).toBe("");
    expect(result.summary).toBe("");
  });

  it("distinguishes primary vs non-primary calendar", () => {
    const primaryCalendar = { id: "cal1", summary: "Primary", primary: true };
    const nonPrimaryCalendar = {
      id: "cal2",
      summary: "Secondary",
      primary: false,
    };
    const undefinedPrimary = { id: "cal3", summary: "Other" };

    expect(parseCalendar(primaryCalendar).primary).toBe(true);
    expect(parseCalendar(nonPrimaryCalendar).primary).toBe(false);
    expect(parseCalendar(undefinedPrimary).primary).toBeUndefined();
  });

  it("handles null values correctly", () => {
    const calendar = {
      id: "cal789",
      summary: "Test",
      description: null,
      timeZone: null,
      primary: null,
      backgroundColor: null,
      foregroundColor: null,
      accessRole: null,
    };

    const result = parseCalendar(calendar);

    expect(result.description).toBeUndefined();
    expect(result.timeZone).toBeUndefined();
    expect(result.primary).toBeUndefined();
    expect(result.backgroundColor).toBeUndefined();
    expect(result.foregroundColor).toBeUndefined();
    expect(result.accessRole).toBeUndefined();
  });
});

describe("isAllDayDate", () => {
  it("returns true for YYYY-MM-DD format", () => {
    expect(isAllDayDate("2024-01-15")).toBe(true);
    expect(isAllDayDate("2024-12-31")).toBe(true);
    expect(isAllDayDate("1999-06-01")).toBe(true);
  });

  it("returns false for RFC3339 datetime format", () => {
    expect(isAllDayDate("2024-01-15T10:00:00Z")).toBe(false);
    expect(isAllDayDate("2024-01-15T10:00:00+05:00")).toBe(false);
    expect(isAllDayDate("2024-01-15T10:00:00-08:00")).toBe(false);
    expect(isAllDayDate("2024-01-15T10:00:00.000Z")).toBe(false);
  });

  it("returns false for invalid date strings", () => {
    expect(isAllDayDate("not-a-date")).toBe(false);
    expect(isAllDayDate("2024/01/15")).toBe(false);
    expect(isAllDayDate("01-15-2024")).toBe(false);
    expect(isAllDayDate("")).toBe(false);
  });
});

describe("parseEvent", () => {
  it("parses event with all fields", () => {
    const event = {
      id: "event123",
      summary: "Team Meeting",
      description: "Weekly sync",
      location: "Conference Room A",
      start: { dateTime: "2024-01-15T10:00:00Z", timeZone: "UTC" },
      end: { dateTime: "2024-01-15T11:00:00Z", timeZone: "UTC" },
      attendees: [
        {
          email: "user1@example.com",
          displayName: "User One",
          responseStatus: "accepted",
          optional: false,
          organizer: true,
          self: false,
        },
        {
          email: "user2@example.com",
          responseStatus: "tentative",
          optional: true,
        },
      ],
      creator: { email: "creator@example.com", displayName: "Creator" },
      organizer: { email: "organizer@example.com", displayName: "Organizer" },
      status: "confirmed",
      htmlLink: "https://calendar.google.com/event?id=event123",
      hangoutLink: "https://meet.google.com/abc-defg-hij",
      recurrence: ["RRULE:FREQ=WEEKLY;COUNT=10"],
      recurringEventId: "recurring123",
      created: "2024-01-01T00:00:00Z",
      updated: "2024-01-14T12:00:00Z",
    };

    const result = parseEvent(event);

    expect(result.id).toBe("event123");
    expect(result.summary).toBe("Team Meeting");
    expect(result.description).toBe("Weekly sync");
    expect(result.location).toBe("Conference Room A");
    expect(result.start.dateTime).toBe("2024-01-15T10:00:00Z");
    expect(result.end.dateTime).toBe("2024-01-15T11:00:00Z");
    expect(result.attendees).toHaveLength(2);
    expect(result.attendees?.[0].email).toBe("user1@example.com");
    expect(result.attendees?.[0].responseStatus).toBe("accepted");
    expect(result.attendees?.[1].optional).toBe(true);
    expect(result.creator?.email).toBe("creator@example.com");
    expect(result.organizer?.displayName).toBe("Organizer");
    expect(result.status).toBe("confirmed");
    expect(result.htmlLink).toBe(
      "https://calendar.google.com/event?id=event123"
    );
    expect(result.hangoutLink).toBe("https://meet.google.com/abc-defg-hij");
    expect(result.recurrence).toEqual(["RRULE:FREQ=WEEKLY;COUNT=10"]);
    expect(result.recurringEventId).toBe("recurring123");
    expect(result.created).toBe("2024-01-01T00:00:00Z");
    expect(result.updated).toBe("2024-01-14T12:00:00Z");
  });

  it("parses event with minimal fields", () => {
    const event = {
      id: "event456",
      start: {},
      end: {},
    };

    const result = parseEvent(event);

    expect(result.id).toBe("event456");
    expect(result.summary).toBe("(No title)");
    expect(result.description).toBeUndefined();
    expect(result.location).toBeUndefined();
    expect(result.start).toEqual({
      date: undefined,
      dateTime: undefined,
      timeZone: undefined,
    });
    expect(result.attendees).toBeUndefined();
    expect(result.creator).toBeUndefined();
    expect(result.organizer).toBeUndefined();
  });

  it("handles all-day events (date without dateTime)", () => {
    const event = {
      id: "allday",
      summary: "Vacation",
      start: { date: "2024-01-15" },
      end: { date: "2024-01-16" },
    };

    const result = parseEvent(event);

    expect(result.start.date).toBe("2024-01-15");
    expect(result.start.dateTime).toBeUndefined();
    expect(result.end.date).toBe("2024-01-16");
    expect(result.end.dateTime).toBeUndefined();
  });

  it("handles cancelled status", () => {
    const event = {
      id: "cancelled",
      summary: "Cancelled Meeting",
      status: "cancelled",
      start: {},
      end: {},
    };

    const result = parseEvent(event);

    expect(result.status).toBe("cancelled");
  });

  it("handles tentative status", () => {
    const event = {
      id: "tentative",
      summary: "Maybe Meeting",
      status: "tentative",
      start: {},
      end: {},
    };

    const result = parseEvent(event);

    expect(result.status).toBe("tentative");
  });

  it("handles event without attendees", () => {
    const event = {
      id: "noattendees",
      summary: "Solo Event",
      start: { dateTime: "2024-01-15T10:00:00Z" },
      end: { dateTime: "2024-01-15T11:00:00Z" },
    };

    const result = parseEvent(event);

    expect(result.attendees).toBeUndefined();
  });

  it("handles empty attendees array", () => {
    const event = {
      id: "emptyattendees",
      summary: "Empty Attendees",
      start: { dateTime: "2024-01-15T10:00:00Z" },
      end: { dateTime: "2024-01-15T11:00:00Z" },
      attendees: [],
    };

    const result = parseEvent(event);

    expect(result.attendees).toEqual([]);
  });

  it("handles missing id with empty string", () => {
    const event = {
      summary: "No ID",
      start: {},
      end: {},
    };

    const result = parseEvent(event);

    expect(result.id).toBe("");
  });

  it("handles missing creator and organizer", () => {
    const event = {
      id: "nocreator",
      summary: "Test",
      start: {},
      end: {},
      creator: undefined,
      organizer: undefined,
    };

    const result = parseEvent(event);

    expect(result.creator).toBeUndefined();
    expect(result.organizer).toBeUndefined();
  });
});

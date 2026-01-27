/**
 * Tests for calendar business logic validation
 */

import type { calendar_v3 } from "googleapis";
import { describe, expect, it } from "vitest";
import { isAllDayDate, parseCalendar, parseEvent } from "@/calendar.ts";
import { calendarCreateEventTool } from "@/tools/calendar-create.ts";
import { createMockCalendarClient } from "../mocks/calendar-client.ts";

describe("isAllDayDate", () => {
  it("returns true for YYYY-MM-DD format", () => {
    expect(isAllDayDate("2024-01-15")).toBe(true);
    expect(isAllDayDate("2024-12-31")).toBe(true);
    expect(isAllDayDate("2025-06-15")).toBe(true);
  });

  it("returns false for RFC3339 datetime format", () => {
    expect(isAllDayDate("2024-01-15T09:00:00-08:00")).toBe(false);
    expect(isAllDayDate("2024-01-15T17:00:00Z")).toBe(false);
    expect(isAllDayDate("2024-12-31T23:59:59+00:00")).toBe(false);
  });

  it("returns false for invalid formats", () => {
    expect(isAllDayDate("2024-1-15")).toBe(false);
    expect(isAllDayDate("01-15-2024")).toBe(false);
    expect(isAllDayDate("2024/01/15")).toBe(false);
    expect(isAllDayDate("")).toBe(false);
    expect(isAllDayDate("not-a-date")).toBe(false);
  });
});

describe("parseEvent", () => {
  it("handles all-day events correctly", () => {
    const apiEvent: calendar_v3.Schema$Event = {
      id: "event123",
      summary: "All Day Event",
      start: {
        date: "2024-01-15",
      },
      end: {
        date: "2024-01-16",
      },
      status: "confirmed",
    };

    const parsed = parseEvent(apiEvent);

    expect(parsed.id).toBe("event123");
    expect(parsed.summary).toBe("All Day Event");
    expect(parsed.start.date).toBe("2024-01-15");
    expect(parsed.start.dateTime).toBeUndefined();
    expect(parsed.end.date).toBe("2024-01-16");
    expect(parsed.end.dateTime).toBeUndefined();
  });

  it("handles timed events correctly", () => {
    const apiEvent: calendar_v3.Schema$Event = {
      id: "event456",
      summary: "Timed Event",
      start: {
        dateTime: "2024-01-15T09:00:00-08:00",
        timeZone: "America/Los_Angeles",
      },
      end: {
        dateTime: "2024-01-15T10:00:00-08:00",
        timeZone: "America/Los_Angeles",
      },
      status: "confirmed",
    };

    const parsed = parseEvent(apiEvent);

    expect(parsed.id).toBe("event456");
    expect(parsed.summary).toBe("Timed Event");
    expect(parsed.start.dateTime).toBe("2024-01-15T09:00:00-08:00");
    expect(parsed.start.timeZone).toBe("America/Los_Angeles");
    expect(parsed.start.date).toBeUndefined();
    expect(parsed.end.dateTime).toBe("2024-01-15T10:00:00-08:00");
    expect(parsed.end.timeZone).toBe("America/Los_Angeles");
    expect(parsed.end.date).toBeUndefined();
  });

  it("handles events without summary", () => {
    const apiEvent: calendar_v3.Schema$Event = {
      id: "event789",
      start: {
        dateTime: "2024-01-15T09:00:00Z",
      },
      end: {
        dateTime: "2024-01-15T10:00:00Z",
      },
    };

    const parsed = parseEvent(apiEvent);

    expect(parsed.summary).toBe("(No title)");
  });

  it("handles events with attendees", () => {
    const apiEvent: calendar_v3.Schema$Event = {
      id: "event123",
      summary: "Meeting",
      start: {
        dateTime: "2024-01-15T09:00:00Z",
      },
      end: {
        dateTime: "2024-01-15T10:00:00Z",
      },
      attendees: [
        {
          email: "alice@example.com",
          displayName: "Alice",
          responseStatus: "accepted",
          optional: false,
        },
        {
          email: "bob@example.com",
          displayName: "Bob",
          responseStatus: "tentative",
          optional: true,
        },
      ],
    };

    const parsed = parseEvent(apiEvent);

    expect(parsed.attendees).toHaveLength(2);
    expect(parsed.attendees?.[0]?.email).toBe("alice@example.com");
    expect(parsed.attendees?.[0]?.displayName).toBe("Alice");
    expect(parsed.attendees?.[0]?.responseStatus).toBe("accepted");
    expect(parsed.attendees?.[0]?.optional).toBe(false);
    expect(parsed.attendees?.[1]?.email).toBe("bob@example.com");
    expect(parsed.attendees?.[1]?.optional).toBe(true);
  });

  it("handles events with creator and organizer", () => {
    const apiEvent: calendar_v3.Schema$Event = {
      id: "event123",
      summary: "Meeting",
      start: {
        dateTime: "2024-01-15T09:00:00Z",
      },
      end: {
        dateTime: "2024-01-15T10:00:00Z",
      },
      creator: {
        email: "creator@example.com",
        displayName: "Creator",
      },
      organizer: {
        email: "organizer@example.com",
        displayName: "Organizer",
      },
    };

    const parsed = parseEvent(apiEvent);

    expect(parsed.creator?.email).toBe("creator@example.com");
    expect(parsed.creator?.displayName).toBe("Creator");
    expect(parsed.organizer?.email).toBe("organizer@example.com");
    expect(parsed.organizer?.displayName).toBe("Organizer");
  });

  it("handles events with recurrence", () => {
    const apiEvent: calendar_v3.Schema$Event = {
      id: "event123",
      summary: "Weekly Meeting",
      start: {
        dateTime: "2024-01-15T09:00:00Z",
      },
      end: {
        dateTime: "2024-01-15T10:00:00Z",
      },
      recurrence: ["RRULE:FREQ=WEEKLY;COUNT=10"],
    };

    const parsed = parseEvent(apiEvent);

    expect(parsed.recurrence).toEqual(["RRULE:FREQ=WEEKLY;COUNT=10"]);
  });

  it("handles events with hangout link", () => {
    const apiEvent: calendar_v3.Schema$Event = {
      id: "event123",
      summary: "Meeting",
      start: {
        dateTime: "2024-01-15T09:00:00Z",
      },
      end: {
        dateTime: "2024-01-15T10:00:00Z",
      },
      hangoutLink: "https://meet.google.com/abc-defg-hij",
    };

    const parsed = parseEvent(apiEvent);

    expect(parsed.hangoutLink).toBe("https://meet.google.com/abc-defg-hij");
  });
});

describe("parseCalendar", () => {
  it("handles minimal calendar info", () => {
    const apiCalendar: calendar_v3.Schema$CalendarListEntry = {
      id: "primary",
      summary: "Primary Calendar",
    };

    const parsed = parseCalendar(apiCalendar);

    expect(parsed.id).toBe("primary");
    expect(parsed.summary).toBe("Primary Calendar");
    expect(parsed.description).toBeUndefined();
    expect(parsed.timeZone).toBeUndefined();
    expect(parsed.primary).toBeUndefined();
  });

  it("handles full calendar info", () => {
    const apiCalendar: calendar_v3.Schema$CalendarListEntry = {
      id: "work@example.com",
      summary: "Work Calendar",
      description: "Work-related events",
      timeZone: "America/Los_Angeles",
      primary: false,
      backgroundColor: "#9fc6e7",
      foregroundColor: "#000000",
      accessRole: "owner",
    };

    const parsed = parseCalendar(apiCalendar);

    expect(parsed.id).toBe("work@example.com");
    expect(parsed.summary).toBe("Work Calendar");
    expect(parsed.description).toBe("Work-related events");
    expect(parsed.timeZone).toBe("America/Los_Angeles");
    expect(parsed.primary).toBe(false);
    expect(parsed.backgroundColor).toBe("#9fc6e7");
    expect(parsed.foregroundColor).toBe("#000000");
    expect(parsed.accessRole).toBe("owner");
  });

  it("handles missing optional fields", () => {
    const apiCalendar: calendar_v3.Schema$CalendarListEntry = {
      id: "calendar123",
      summary: "Test Calendar",
      description: undefined,
      timeZone: undefined,
      primary: undefined,
    };

    const parsed = parseCalendar(apiCalendar);

    expect(parsed.id).toBe("calendar123");
    expect(parsed.summary).toBe("Test Calendar");
    expect(parsed.description).toBeUndefined();
    expect(parsed.timeZone).toBeUndefined();
    expect(parsed.primary).toBeUndefined();
  });
});

describe("calendarCreateEventTool confirmation requirement", () => {
  it("requires confirm to be true", async () => {
    const client = createMockCalendarClient();
    const result = await calendarCreateEventTool(client, {
      calendar_id: "primary",
      summary: "Test Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      confirm: false,
      add_meet: false,
      output_format: "markdown",
    });

    expect(client.createEvent).not.toHaveBeenCalled();
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("confirmation");
    }
  });

  it("creates event when confirm is true", async () => {
    const client = createMockCalendarClient();
    await calendarCreateEventTool(client, {
      calendar_id: "primary",
      summary: "Test Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      confirm: true,
      add_meet: false,
      output_format: "markdown",
    });

    expect(client.createEvent).toHaveBeenCalled();
  });
});

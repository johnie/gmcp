/**
 * Calendar pipeline integration tests
 * Tests full HTTP response → client parsing → output flow using MSW
 */

import { describe, expect, it } from "vitest";
import { createCalendarClient } from "@/calendar.ts";
import { createMockOAuth2Client } from "../helpers/auth.ts";
import {
  mockCalendarError,
  mockCalendarRateLimited,
  mockCalendarUnauthorized,
} from "../msw/utils.ts";

describe("Calendar Pipeline Integration", () => {
  const auth = createMockOAuth2Client();
  const client = createCalendarClient(auth);

  describe("listCalendars", () => {
    it("should list visible calendars", async () => {
      const calendars = await client.listCalendars();

      expect(calendars.length).toBeGreaterThan(0);
      const primary = calendars.find((c) => c.primary === true);
      expect(primary).toBeDefined();
      expect(primary?.id).toBe("primary");
      expect(primary?.summary).toBe("user@example.com");
      expect(primary?.accessRole).toBe("owner");
    });

    it("should include hidden calendars when requested", async () => {
      const calendars = await client.listCalendars(true);

      const hidden = calendars.find(
        (c) => c.id === "hidden@group.calendar.google.com"
      );
      expect(hidden).toBeDefined();
      expect(hidden?.summary).toBe("Hidden Calendar");
    });

    it("should parse calendar properties correctly", async () => {
      const calendars = await client.listCalendars();

      const workCal = calendars.find(
        (c) => c.id === "work@group.calendar.google.com"
      );
      expect(workCal).toBeDefined();
      expect(workCal?.summary).toBe("Work");
      expect(workCal?.description).toBe("Work events and meetings");
      expect(workCal?.timeZone).toBe("America/Los_Angeles");
      expect(workCal?.backgroundColor).toBe("#4285f4");
      expect(workCal?.foregroundColor).toBe("#ffffff");
    });
  });

  describe("listEvents", () => {
    it("should list events", async () => {
      const events = await client.listEvents("primary");

      expect(events.length).toBeGreaterThan(0);
    });

    it("should parse timed event correctly", async () => {
      const event = await client.getEvent("primary", "event_timed_001");

      expect(event.id).toBe("event_timed_001");
      expect(event.summary).toBe("Team Standup");
      expect(event.description).toBe("Daily standup meeting");
      expect(event.location).toBe("Conference Room A");
      expect(event.status).toBe("confirmed");
      expect(event.start.dateTime).toBe("2024-01-15T09:00:00-08:00");
      expect(event.start.timeZone).toBe("America/Los_Angeles");
      expect(event.end.dateTime).toBe("2024-01-15T09:30:00-08:00");
      expect(event.htmlLink).toContain("calendar.google.com");
      expect(event.creator?.email).toBe("organizer@example.com");
      expect(event.attendees).toHaveLength(2);
    });

    it("should parse all-day event correctly", async () => {
      const event = await client.getEvent("primary", "event_allday_002");

      expect(event.id).toBe("event_allday_002");
      expect(event.summary).toBe("Company Holiday");
      expect(event.start.date).toBe("2024-01-15");
      expect(event.start.dateTime).toBeUndefined();
      expect(event.end.date).toBe("2024-01-16");
    });

    it("should parse event with Google Meet link", async () => {
      const event = await client.getEvent("primary", "event_meet_003");

      expect(event.id).toBe("event_meet_003");
      expect(event.summary).toBe("Remote Planning Session");
      expect(event.hangoutLink).toBe("https://meet.google.com/abc-defg-hij");
    });

    it("should parse recurring event", async () => {
      const event = await client.getEvent("primary", "event_recurring_004");

      expect(event.id).toBe("event_recurring_004");
      expect(event.summary).toBe("Weekly 1:1");
      expect(event.recurrence).toBeDefined();
      expect(event.recurrence).toContain("RRULE:FREQ=WEEKLY;BYDAY=WE");
    });

    it("should parse recurring event instance", async () => {
      const event = await client.getEvent(
        "primary",
        "event_recurring_004_20240124T190000Z"
      );

      expect(event.recurringEventId).toBe("event_recurring_004");
      expect(event.summary).toBe("Weekly 1:1");
    });

    it("should parse attendees with different response statuses", async () => {
      const event = await client.getEvent("primary", "event_optional_006");

      expect(event.attendees).toHaveLength(3);

      const required = event.attendees?.find(
        (a) => a.email === "required@example.com"
      );
      expect(required?.optional).toBe(false);
      expect(required?.responseStatus).toBe("accepted");

      const optional1 = event.attendees?.find(
        (a) => a.email === "optional1@example.com"
      );
      expect(optional1?.optional).toBe(true);
      expect(optional1?.responseStatus).toBe("needsAction");

      const optional2 = event.attendees?.find(
        (a) => a.email === "optional2@example.com"
      );
      expect(optional2?.optional).toBe(true);
      expect(optional2?.responseStatus).toBe("declined");
    });

    it("should handle minimal event with sparse fields", async () => {
      const event = await client.getEvent("primary", "event_minimal_007");

      expect(event.id).toBe("event_minimal_007");
      expect(event.summary).toBe("Quick Sync");
      expect(event.description).toBeUndefined();
      expect(event.location).toBeUndefined();
      expect(event.attendees).toBeUndefined();
    });
  });

  describe("createEvent", () => {
    it("should create timed event", async () => {
      const event = await client.createEvent(
        "primary",
        "New Meeting",
        "2024-02-01T10:00:00-08:00",
        "2024-02-01T11:00:00-08:00",
        "Discussion about project",
        "Room 101"
      );

      expect(event.id).toBeDefined();
      expect(event.summary).toBe("New Meeting");
      expect(event.description).toBe("Discussion about project");
      expect(event.location).toBe("Room 101");
      expect(event.status).toBe("confirmed");
    });

    it("should create all-day event", async () => {
      const event = await client.createEvent(
        "primary",
        "Team Offsite",
        "2024-02-15",
        "2024-02-16"
      );

      expect(event.id).toBeDefined();
      expect(event.summary).toBe("Team Offsite");
      // All-day events use date format
      expect(event.start.date).toBe("2024-02-15");
      expect(event.end.date).toBe("2024-02-16");
    });

    it("should create event with attendees", async () => {
      const event = await client.createEvent(
        "primary",
        "Team Meeting",
        "2024-02-01T14:00:00-08:00",
        "2024-02-01T15:00:00-08:00",
        undefined,
        undefined,
        ["alice@example.com", "bob@example.com"]
      );

      expect(event.id).toBeDefined();
      expect(event.attendees).toHaveLength(2);
      expect(event.attendees?.[0].email).toBe("alice@example.com");
    });

    it("should create event with Google Meet", async () => {
      const event = await client.createEvent(
        "primary",
        "Remote Sync",
        "2024-02-01T16:00:00-08:00",
        "2024-02-01T17:00:00-08:00",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true // addMeet
      );

      expect(event.id).toBeDefined();
      expect(event.hangoutLink).toBeDefined();
      expect(event.hangoutLink).toContain("meet.google.com");
    });

    it("should create recurring event", async () => {
      const event = await client.createEvent(
        "primary",
        "Weekly Standup",
        "2024-02-05T09:00:00-08:00",
        "2024-02-05T09:30:00-08:00",
        undefined,
        undefined,
        undefined,
        "America/Los_Angeles",
        ["RRULE:FREQ=WEEKLY;BYDAY=MO"]
      );

      expect(event.id).toBeDefined();
      expect(event.summary).toBe("Weekly Standup");
      expect(event.recurrence).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO");
    });
  });

  describe("error handling", () => {
    it("should handle 404 for non-existent event", async () => {
      await expect(
        client.getEvent("primary", "nonexistent_event")
      ).rejects.toThrow("Failed to get event nonexistent_event");
    });

    it("should handle 401 unauthorized", async () => {
      mockCalendarUnauthorized();

      await expect(client.listCalendars()).rejects.toThrow();
    });

    it("should handle 429 rate limit", async () => {
      mockCalendarRateLimited();

      await expect(client.listCalendars()).rejects.toThrow();
    });

    it("should handle custom error on specific endpoint", async () => {
      mockCalendarError(
        "get",
        "/calendars/error_cal/events",
        500,
        "Internal server error"
      );

      await expect(client.listEvents("error_cal")).rejects.toThrow();
    });
  });
});

/**
 * Tests for calendar tool input schemas validation
 */

import { describe, expect, it } from "vitest";
import { CalendarCreateEventInputSchema } from "@/tools/calendar-create.ts";
import { CalendarEventsInputSchema } from "@/tools/calendar-events.ts";
import { CalendarGetEventInputSchema } from "@/tools/calendar-get-event.ts";
import { CalendarListInputSchema } from "@/tools/calendar-list.ts";

describe("CalendarListInputSchema", () => {
  it("validates valid minimal input", () => {
    const input = {};
    const result = CalendarListInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("applies default values", () => {
    const input = {};
    const result = CalendarListInputSchema.parse(input);
    expect(result.show_hidden).toBe(false);
    expect(result.output_format).toBe("markdown");
  });

  it("validates show_hidden boolean", () => {
    const withTrue = { show_hidden: true };
    expect(CalendarListInputSchema.safeParse(withTrue).success).toBe(true);

    const withFalse = { show_hidden: false };
    expect(CalendarListInputSchema.safeParse(withFalse).success).toBe(true);
  });

  it("validates output_format enum", () => {
    const invalid = { output_format: "xml" };
    expect(CalendarListInputSchema.safeParse(invalid).success).toBe(false);

    const markdown = { output_format: "markdown" };
    expect(CalendarListInputSchema.safeParse(markdown).success).toBe(true);

    const json = { output_format: "json" };
    expect(CalendarListInputSchema.safeParse(json).success).toBe(true);
  });
});

describe("CalendarEventsInputSchema", () => {
  it("validates valid minimal input", () => {
    const input = {};
    const result = CalendarEventsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("applies default values", () => {
    const input = {};
    const result = CalendarEventsInputSchema.parse(input);
    expect(result.calendar_id).toBe("primary");
    expect(result.max_results).toBe(10);
    expect(result.single_events).toBe(true);
    expect(result.order_by).toBe("startTime");
    expect(result.output_format).toBe("markdown");
  });

  it("validates time range strings", () => {
    const input = {
      time_min: "2024-01-01T00:00:00Z",
      time_max: "2024-12-31T23:59:59Z",
    };
    const result = CalendarEventsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates max_results bounds", () => {
    const tooSmall = { max_results: 0 };
    expect(CalendarEventsInputSchema.safeParse(tooSmall).success).toBe(false);

    const tooLarge = { max_results: 251 };
    expect(CalendarEventsInputSchema.safeParse(tooLarge).success).toBe(false);

    const minValid = { max_results: 1 };
    expect(CalendarEventsInputSchema.safeParse(minValid).success).toBe(true);

    const maxValid = { max_results: 250 };
    expect(CalendarEventsInputSchema.safeParse(maxValid).success).toBe(true);

    const midValid = { max_results: 50 };
    expect(CalendarEventsInputSchema.safeParse(midValid).success).toBe(true);
  });

  it("validates order_by enum", () => {
    const invalid = { order_by: "created" };
    expect(CalendarEventsInputSchema.safeParse(invalid).success).toBe(false);

    const startTime = { order_by: "startTime" };
    expect(CalendarEventsInputSchema.safeParse(startTime).success).toBe(true);

    const updated = { order_by: "updated" };
    expect(CalendarEventsInputSchema.safeParse(updated).success).toBe(true);
  });

  it("validates output_format enum", () => {
    const invalid = { output_format: "xml" };
    expect(CalendarEventsInputSchema.safeParse(invalid).success).toBe(false);

    const markdown = { output_format: "markdown" };
    expect(CalendarEventsInputSchema.safeParse(markdown).success).toBe(true);

    const json = { output_format: "json" };
    expect(CalendarEventsInputSchema.safeParse(json).success).toBe(true);
  });

  it("validates full input", () => {
    const input = {
      calendar_id: "work@example.com",
      time_min: "2024-01-15T00:00:00-08:00",
      time_max: "2024-01-22T23:59:59-08:00",
      max_results: 50,
      query: "meeting",
      single_events: false,
      order_by: "updated" as const,
      output_format: "json" as const,
    };
    const result = CalendarEventsInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe("CalendarGetEventInputSchema", () => {
  it("validates valid minimal input", () => {
    const input = { event_id: "event123" };
    const result = CalendarGetEventInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("applies default values", () => {
    const input = { event_id: "event123" };
    const result = CalendarGetEventInputSchema.parse(input);
    expect(result.calendar_id).toBe("primary");
    expect(result.output_format).toBe("markdown");
  });

  it("rejects empty event_id", () => {
    const input = { event_id: "" };
    const result = CalendarGetEventInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("validates with custom calendar_id", () => {
    const input = {
      calendar_id: "team@example.com",
      event_id: "event456",
    };
    const result = CalendarGetEventInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates output_format enum", () => {
    const invalid = { event_id: "event123", output_format: "xml" };
    expect(CalendarGetEventInputSchema.safeParse(invalid).success).toBe(false);

    const markdown = { event_id: "event123", output_format: "markdown" };
    expect(CalendarGetEventInputSchema.safeParse(markdown).success).toBe(true);

    const json = { event_id: "event123", output_format: "json" };
    expect(CalendarGetEventInputSchema.safeParse(json).success).toBe(true);
  });
});

describe("CalendarCreateEventInputSchema", () => {
  it("validates valid minimal input", () => {
    const input = {
      summary: "Team Meeting",
      start: "2024-01-15T09:00:00-08:00",
      end: "2024-01-15T10:00:00-08:00",
    };
    const result = CalendarCreateEventInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("applies default values", () => {
    const input = {
      summary: "Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
    };
    const result = CalendarCreateEventInputSchema.parse(input);
    expect(result.calendar_id).toBe("primary");
    expect(result.add_meet).toBe(false);
    expect(result.confirm).toBe(false);
    expect(result.output_format).toBe("markdown");
  });

  it("rejects empty summary", () => {
    const input = {
      summary: "",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
    };
    const result = CalendarCreateEventInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects empty start time", () => {
    const input = {
      summary: "Event",
      start: "",
      end: "2024-01-15T10:00:00Z",
    };
    const result = CalendarCreateEventInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects empty end time", () => {
    const input = {
      summary: "Event",
      start: "2024-01-15T09:00:00Z",
      end: "",
    };
    const result = CalendarCreateEventInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("validates attendees email validation", () => {
    const invalidEmail = {
      summary: "Meeting",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      attendees: ["invalid-email"],
    };
    expect(CalendarCreateEventInputSchema.safeParse(invalidEmail).success).toBe(
      false
    );

    const validEmail = {
      summary: "Meeting",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      attendees: ["alice@example.com"],
    };
    expect(CalendarCreateEventInputSchema.safeParse(validEmail).success).toBe(
      true
    );

    const multipleValid = {
      summary: "Meeting",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      attendees: ["alice@example.com", "bob@example.com"],
    };
    expect(
      CalendarCreateEventInputSchema.safeParse(multipleValid).success
    ).toBe(true);
  });

  it("validates confirm boolean default", () => {
    const input = {
      summary: "Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
    };
    const result = CalendarCreateEventInputSchema.parse(input);
    expect(result.confirm).toBe(false);
  });

  it("validates full input with all fields", () => {
    const input = {
      calendar_id: "team@example.com",
      summary: "Sprint Planning",
      start: "2024-01-15T10:00:00-08:00",
      end: "2024-01-15T11:30:00-08:00",
      description: "Q1 sprint planning session",
      location: "Conference Room A",
      attendees: ["alice@example.com", "bob@example.com"],
      timezone: "America/Los_Angeles",
      recurrence: ["RRULE:FREQ=WEEKLY;COUNT=10"],
      add_meet: true,
      confirm: true,
      output_format: "json" as const,
    };
    const result = CalendarCreateEventInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates all-day event format", () => {
    const input = {
      summary: "Conference",
      start: "2024-01-20",
      end: "2024-01-21",
    };
    const result = CalendarCreateEventInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates output_format enum", () => {
    const invalid = {
      summary: "Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      output_format: "xml",
    };
    expect(CalendarCreateEventInputSchema.safeParse(invalid).success).toBe(
      false
    );

    const markdown = {
      summary: "Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      output_format: "markdown",
    };
    expect(CalendarCreateEventInputSchema.safeParse(markdown).success).toBe(
      true
    );

    const json = {
      summary: "Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      output_format: "json",
    };
    expect(CalendarCreateEventInputSchema.safeParse(json).success).toBe(true);
  });
});

/**
 * Tests for calendar tool handlers
 */

import { describe, expect, it, vi } from "vitest";
import { calendarCreateEventTool } from "@/tools/calendar-create.ts";
import { calendarEventsTool } from "@/tools/calendar-events.ts";
import { calendarGetEventTool } from "@/tools/calendar-get-event.ts";
import { calendarListTool } from "@/tools/calendar-list.ts";
import { createMockCalendarClient } from "../mocks/calendar-client.ts";

describe("calendarListTool", () => {
  it("calls client.listCalendars with show_hidden param", async () => {
    const client = createMockCalendarClient();
    await calendarListTool(client, {
      show_hidden: true,
      output_format: "markdown",
    });

    expect(client.listCalendars).toHaveBeenCalledWith(true);
  });

  it("returns markdown format by default", async () => {
    const client = createMockCalendarClient();
    const result = await calendarListTool(client, {
      show_hidden: false,
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Calendars");
    }
  });

  it("returns JSON format when requested", async () => {
    const client = createMockCalendarClient();
    const result = await calendarListTool(client, {
      show_hidden: false,
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("count");
      expect(parsed).toHaveProperty("calendars");
    }
  });

  it("includes structured content in response", async () => {
    const client = createMockCalendarClient();
    const result = await calendarListTool(client, {
      show_hidden: false,
      output_format: "markdown",
    });

    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent?.count).toBe(1);
    expect(result.structuredContent?.calendars).toBeDefined();
  });

  it("handles errors gracefully", async () => {
    const client = createMockCalendarClient({
      listCalendars: vi.fn().mockRejectedValue(new Error("API Error")),
    });
    const result = await calendarListTool(client, {
      show_hidden: false,
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

describe("calendarEventsTool", () => {
  it("passes time_min and time_max correctly", async () => {
    const client = createMockCalendarClient();
    await calendarEventsTool(client, {
      calendar_id: "primary",
      time_min: "2024-01-01T00:00:00Z",
      time_max: "2024-12-31T23:59:59Z",
      max_results: 10,
      single_events: true,
      order_by: "startTime",
      output_format: "markdown",
    });

    expect(client.listEvents).toHaveBeenCalledWith(
      "primary",
      "2024-01-01T00:00:00Z",
      "2024-12-31T23:59:59Z",
      10,
      undefined,
      true,
      "startTime"
    );
  });

  it("passes max_results correctly", async () => {
    const client = createMockCalendarClient();
    await calendarEventsTool(client, {
      calendar_id: "primary",
      max_results: 50,
      single_events: true,
      order_by: "startTime",
      output_format: "markdown",
    });

    expect(client.listEvents).toHaveBeenCalledWith(
      "primary",
      undefined,
      undefined,
      50,
      undefined,
      true,
      "startTime"
    );
  });

  it("passes query parameter correctly", async () => {
    const client = createMockCalendarClient();
    await calendarEventsTool(client, {
      calendar_id: "primary",
      query: "meeting",
      max_results: 10,
      single_events: true,
      order_by: "startTime",
      output_format: "markdown",
    });

    expect(client.listEvents).toHaveBeenCalledWith(
      "primary",
      undefined,
      undefined,
      10,
      "meeting",
      true,
      "startTime"
    );
  });

  it("passes orderBy when single_events is true", async () => {
    const client = createMockCalendarClient();
    await calendarEventsTool(client, {
      calendar_id: "primary",
      max_results: 10,
      single_events: true,
      order_by: "updated",
      output_format: "markdown",
    });

    expect(client.listEvents).toHaveBeenCalledWith(
      "primary",
      undefined,
      undefined,
      10,
      undefined,
      true,
      "updated"
    );
  });

  it("returns markdown format by default", async () => {
    const client = createMockCalendarClient();
    const result = await calendarEventsTool(client, {
      calendar_id: "primary",
      max_results: 10,
      single_events: true,
      order_by: "startTime",
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Events");
    }
  });

  it("returns JSON format when requested", async () => {
    const client = createMockCalendarClient();
    const result = await calendarEventsTool(client, {
      calendar_id: "primary",
      max_results: 10,
      single_events: true,
      order_by: "startTime",
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("calendar_id");
      expect(parsed).toHaveProperty("count");
      expect(parsed).toHaveProperty("events");
    }
  });

  it("includes structured content in response", async () => {
    const client = createMockCalendarClient();
    const result = await calendarEventsTool(client, {
      calendar_id: "primary",
      max_results: 10,
      single_events: true,
      order_by: "startTime",
      output_format: "markdown",
    });

    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent?.calendar_id).toBe("primary");
    expect(result.structuredContent?.count).toBe(1);
  });

  it("handles errors gracefully", async () => {
    const client = createMockCalendarClient({
      listEvents: vi.fn().mockRejectedValue(new Error("API Error")),
    });
    const result = await calendarEventsTool(client, {
      calendar_id: "primary",
      max_results: 10,
      single_events: true,
      order_by: "startTime",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

describe("calendarGetEventTool", () => {
  it("calls client.getEvent with correct params", async () => {
    const client = createMockCalendarClient();
    await calendarGetEventTool(client, {
      calendar_id: "team@example.com",
      event_id: "event123",
      output_format: "markdown",
    });

    expect(client.getEvent).toHaveBeenCalledWith(
      "team@example.com",
      "event123"
    );
  });

  it("returns markdown format by default", async () => {
    const client = createMockCalendarClient();
    const result = await calendarGetEventTool(client, {
      calendar_id: "primary",
      event_id: "event123",
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Test Event");
    }
  });

  it("returns JSON format when requested", async () => {
    const client = createMockCalendarClient();
    const result = await calendarGetEventTool(client, {
      calendar_id: "primary",
      event_id: "event123",
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("id");
      expect(parsed).toHaveProperty("summary");
    }
  });

  it("includes structured content in response", async () => {
    const client = createMockCalendarClient();
    const result = await calendarGetEventTool(client, {
      calendar_id: "primary",
      event_id: "event123",
      output_format: "markdown",
    });

    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent?.id).toBe("event123");
    expect(result.structuredContent?.summary).toBe("Test Event");
  });

  it("handles errors for missing event", async () => {
    const client = createMockCalendarClient({
      getEvent: vi.fn().mockRejectedValue(new Error("Event not found")),
    });
    const result = await calendarGetEventTool(client, {
      calendar_id: "primary",
      event_id: "invalid",
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

describe("calendarCreateEventTool", () => {
  it("returns error when confirm is false", async () => {
    const client = createMockCalendarClient();
    const result = await calendarCreateEventTool(client, {
      calendar_id: "primary",
      summary: "Test Meeting",
      start: "2024-01-15T09:00:00-08:00",
      end: "2024-01-15T10:00:00-08:00",
      confirm: false,
      add_meet: false,
      output_format: "markdown",
    });

    expect(client.createEvent).not.toHaveBeenCalled();
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("confirmation");
    }
    expect(result.structuredContent?.error).toBe("Confirmation required");
  });

  it("calls client.createEvent with all params when confirm is true", async () => {
    const client = createMockCalendarClient();
    await calendarCreateEventTool(client, {
      calendar_id: "team@example.com",
      summary: "Sprint Planning",
      start: "2024-01-15T10:00:00-08:00",
      end: "2024-01-15T11:30:00-08:00",
      description: "Q1 planning",
      location: "Room A",
      attendees: ["alice@example.com", "bob@example.com"],
      timezone: "America/Los_Angeles",
      recurrence: ["RRULE:FREQ=WEEKLY;COUNT=10"],
      add_meet: false,
      confirm: true,
      output_format: "markdown",
    });

    expect(client.createEvent).toHaveBeenCalledWith(
      "team@example.com",
      "Sprint Planning",
      "2024-01-15T10:00:00-08:00",
      "2024-01-15T11:30:00-08:00",
      "Q1 planning",
      "Room A",
      ["alice@example.com", "bob@example.com"],
      "America/Los_Angeles",
      ["RRULE:FREQ=WEEKLY;COUNT=10"],
      false
    );
  });

  it("forwards add_meet flag correctly", async () => {
    const client = createMockCalendarClient();
    await calendarCreateEventTool(client, {
      calendar_id: "primary",
      summary: "Meeting with Meet",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      add_meet: true,
      confirm: true,
      output_format: "markdown",
    });

    expect(client.createEvent).toHaveBeenCalledWith(
      "primary",
      "Meeting with Meet",
      "2024-01-15T09:00:00Z",
      "2024-01-15T10:00:00Z",
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    );
  });

  it("returns markdown format by default", async () => {
    const client = createMockCalendarClient();
    const result = await calendarCreateEventTool(client, {
      calendar_id: "primary",
      summary: "New Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      confirm: true,
      add_meet: false,
      output_format: "markdown",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Event created");
    }
  });

  it("returns JSON format when requested", async () => {
    const client = createMockCalendarClient();
    const result = await calendarCreateEventTool(client, {
      calendar_id: "primary",
      summary: "New Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      confirm: true,
      add_meet: false,
      output_format: "json",
    });

    expect(result.content[0]?.type).toBe("text");
    if (result.content[0]?.type === "text") {
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("id");
      expect(parsed).toHaveProperty("summary");
    }
  });

  it("includes structured content in response", async () => {
    const client = createMockCalendarClient();
    const result = await calendarCreateEventTool(client, {
      calendar_id: "primary",
      summary: "New Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      confirm: true,
      add_meet: false,
      output_format: "markdown",
    });

    expect(result.structuredContent).toBeDefined();
    expect(result.structuredContent?.id).toBe("event123");
    expect(result.structuredContent?.summary).toBe("Test Event");
  });

  it("handles errors gracefully", async () => {
    const client = createMockCalendarClient({
      createEvent: vi.fn().mockRejectedValue(new Error("Creation failed")),
    });
    const result = await calendarCreateEventTool(client, {
      calendar_id: "primary",
      summary: "New Event",
      start: "2024-01-15T09:00:00Z",
      end: "2024-01-15T10:00:00Z",
      confirm: true,
      add_meet: false,
      output_format: "markdown",
    });

    expect("isError" in result && result.isError).toBe(true);
    if (result.content[0]?.type === "text") {
      expect(result.content[0].text).toContain("Error");
    }
  });
});

/**
 * Mock CalendarClient for testing
 */

import { vi } from "vitest";
import type { CalendarClient } from "@/calendar.ts";
import type { CalendarEvent, CalendarInfo } from "@/types.ts";

export function createMockCalendarClient(
  overrides: Partial<CalendarClient> = {}
): CalendarClient {
  const defaultCalendarInfo: CalendarInfo = {
    id: "primary",
    summary: "Primary Calendar",
    description: "Main calendar",
    timeZone: "America/Los_Angeles",
    primary: true,
    backgroundColor: "#9fc6e7",
    foregroundColor: "#000000",
    accessRole: "owner",
  };

  const defaultCalendarEvent: CalendarEvent = {
    id: "event123",
    summary: "Test Event",
    description: "Test event description",
    location: "Test Location",
    start: {
      dateTime: "2024-01-15T09:00:00-08:00",
      timeZone: "America/Los_Angeles",
    },
    end: {
      dateTime: "2024-01-15T10:00:00-08:00",
      timeZone: "America/Los_Angeles",
    },
    status: "confirmed",
    htmlLink: "https://calendar.google.com/event?eid=event123",
    attendees: [
      {
        email: "attendee@example.com",
        displayName: "Test Attendee",
        responseStatus: "accepted",
        optional: false,
      },
    ],
    creator: {
      email: "creator@example.com",
      displayName: "Event Creator",
    },
    organizer: {
      email: "organizer@example.com",
      displayName: "Event Organizer",
    },
  };

  return {
    listCalendars: vi.fn().mockResolvedValue([defaultCalendarInfo]),
    listEvents: vi.fn().mockResolvedValue([defaultCalendarEvent]),
    getEvent: vi.fn().mockResolvedValue(defaultCalendarEvent),
    createEvent: vi.fn().mockResolvedValue(defaultCalendarEvent),
    ...overrides,
  };
}

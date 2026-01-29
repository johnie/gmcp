/**
 * Calendar event fixtures for MSW handlers
 * Using googleapis types for type safety
 */

import type { calendar_v3 } from "googleapis";

/**
 * Simple timed event
 */
export const timedEvent: calendar_v3.Schema$Event = {
  id: "event_timed_001",
  summary: "Team Standup",
  description: "Daily standup meeting",
  location: "Conference Room A",
  start: {
    dateTime: "2024-01-15T09:00:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  end: {
    dateTime: "2024-01-15T09:30:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  status: "confirmed",
  htmlLink: "https://calendar.google.com/event?eid=event_timed_001",
  creator: {
    email: "organizer@example.com",
    displayName: "Team Lead",
  },
  organizer: {
    email: "organizer@example.com",
    displayName: "Team Lead",
  },
  attendees: [
    {
      email: "dev1@example.com",
      displayName: "Developer One",
      responseStatus: "accepted",
    },
    {
      email: "dev2@example.com",
      displayName: "Developer Two",
      responseStatus: "tentative",
    },
  ],
  created: "2024-01-01T12:00:00.000Z",
  updated: "2024-01-10T14:30:00.000Z",
};

/**
 * All-day event
 */
export const allDayEvent: calendar_v3.Schema$Event = {
  id: "event_allday_002",
  summary: "Company Holiday",
  description: "Office closed",
  start: {
    date: "2024-01-15",
  },
  end: {
    date: "2024-01-16",
  },
  status: "confirmed",
  htmlLink: "https://calendar.google.com/event?eid=event_allday_002",
  creator: {
    email: "hr@example.com",
    displayName: "HR Team",
  },
  organizer: {
    email: "hr@example.com",
    displayName: "HR Team",
  },
  created: "2024-01-01T10:00:00.000Z",
  updated: "2024-01-01T10:00:00.000Z",
};

/**
 * Event with Google Meet link
 */
export const eventWithMeet: calendar_v3.Schema$Event = {
  id: "event_meet_003",
  summary: "Remote Planning Session",
  description: "Q1 planning meeting",
  start: {
    dateTime: "2024-01-16T14:00:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  end: {
    dateTime: "2024-01-16T16:00:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  status: "confirmed",
  htmlLink: "https://calendar.google.com/event?eid=event_meet_003",
  hangoutLink: "https://meet.google.com/abc-defg-hij",
  conferenceData: {
    entryPoints: [
      {
        entryPointType: "video",
        uri: "https://meet.google.com/abc-defg-hij",
        label: "meet.google.com/abc-defg-hij",
      },
    ],
    conferenceSolution: {
      key: { type: "hangoutsMeet" },
      name: "Google Meet",
    },
  },
  creator: {
    email: "manager@example.com",
    displayName: "Product Manager",
  },
  organizer: {
    email: "manager@example.com",
    displayName: "Product Manager",
  },
  created: "2024-01-02T08:00:00.000Z",
  updated: "2024-01-05T09:15:00.000Z",
};

/**
 * Recurring event
 */
export const recurringEvent: calendar_v3.Schema$Event = {
  id: "event_recurring_004",
  summary: "Weekly 1:1",
  description: "Weekly check-in meeting",
  location: "Manager's Office",
  start: {
    dateTime: "2024-01-17T11:00:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  end: {
    dateTime: "2024-01-17T11:30:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  status: "confirmed",
  htmlLink: "https://calendar.google.com/event?eid=event_recurring_004",
  recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=WE"],
  creator: {
    email: "manager@example.com",
  },
  organizer: {
    email: "manager@example.com",
  },
  attendees: [
    {
      email: "report@example.com",
      responseStatus: "accepted",
      self: true,
    },
    {
      email: "manager@example.com",
      responseStatus: "accepted",
      organizer: true,
    },
  ],
  created: "2024-01-01T09:00:00.000Z",
  updated: "2024-01-01T09:00:00.000Z",
};

/**
 * Instance of recurring event
 */
export const recurringEventInstance: calendar_v3.Schema$Event = {
  id: "event_recurring_004_20240124T190000Z",
  summary: "Weekly 1:1",
  description: "Weekly check-in meeting",
  location: "Manager's Office",
  start: {
    dateTime: "2024-01-24T11:00:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  end: {
    dateTime: "2024-01-24T11:30:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  status: "confirmed",
  htmlLink:
    "https://calendar.google.com/event?eid=event_recurring_004_instance",
  recurringEventId: "event_recurring_004",
  creator: {
    email: "manager@example.com",
  },
  organizer: {
    email: "manager@example.com",
  },
  created: "2024-01-01T09:00:00.000Z",
  updated: "2024-01-01T09:00:00.000Z",
};

/**
 * Cancelled event
 */
export const cancelledEvent: calendar_v3.Schema$Event = {
  id: "event_cancelled_005",
  summary: "Cancelled Meeting",
  status: "cancelled",
  start: {
    dateTime: "2024-01-18T10:00:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  end: {
    dateTime: "2024-01-18T11:00:00-08:00",
    timeZone: "America/Los_Angeles",
  },
};

/**
 * Event with optional attendees
 */
export const eventWithOptionalAttendees: calendar_v3.Schema$Event = {
  id: "event_optional_006",
  summary: "Team Lunch",
  description: "Optional team lunch",
  location: "Local Restaurant",
  start: {
    dateTime: "2024-01-19T12:00:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  end: {
    dateTime: "2024-01-19T13:30:00-08:00",
    timeZone: "America/Los_Angeles",
  },
  status: "confirmed",
  htmlLink: "https://calendar.google.com/event?eid=event_optional_006",
  creator: {
    email: "social@example.com",
  },
  organizer: {
    email: "social@example.com",
  },
  attendees: [
    {
      email: "required@example.com",
      responseStatus: "accepted",
      optional: false,
    },
    {
      email: "optional1@example.com",
      responseStatus: "needsAction",
      optional: true,
    },
    {
      email: "optional2@example.com",
      responseStatus: "declined",
      optional: true,
    },
  ],
  created: "2024-01-05T15:00:00.000Z",
  updated: "2024-01-05T15:00:00.000Z",
};

/**
 * Minimal event (sparse fields)
 */
export const minimalEvent: calendar_v3.Schema$Event = {
  id: "event_minimal_007",
  summary: "Quick Sync",
  start: {
    dateTime: "2024-01-20T15:00:00-08:00",
  },
  end: {
    dateTime: "2024-01-20T15:15:00-08:00",
  },
};

/**
 * All events for list endpoint
 */
export const allEvents: calendar_v3.Schema$Event[] = [
  timedEvent,
  allDayEvent,
  eventWithMeet,
  recurringEvent,
  recurringEventInstance,
  eventWithOptionalAttendees,
  minimalEvent,
];

/**
 * Get events as a map by ID
 */
export const eventFixtures: Map<string, calendar_v3.Schema$Event> = new Map([
  ["event_timed_001", timedEvent],
  ["event_allday_002", allDayEvent],
  ["event_meet_003", eventWithMeet],
  ["event_recurring_004", recurringEvent],
  ["event_recurring_004_20240124T190000Z", recurringEventInstance],
  ["event_cancelled_005", cancelledEvent],
  ["event_optional_006", eventWithOptionalAttendees],
  ["event_minimal_007", minimalEvent],
]);

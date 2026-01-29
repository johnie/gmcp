/**
 * Calendar list fixtures for MSW handlers
 */

import type { calendar_v3 } from "googleapis";

/**
 * Primary calendar
 */
export const primaryCalendar: calendar_v3.Schema$CalendarListEntry = {
  id: "primary",
  summary: "user@example.com",
  description: "Primary calendar",
  timeZone: "America/Los_Angeles",
  primary: true,
  backgroundColor: "#9fc6e7",
  foregroundColor: "#000000",
  accessRole: "owner",
};

/**
 * Work calendar
 */
export const workCalendar: calendar_v3.Schema$CalendarListEntry = {
  id: "work@group.calendar.google.com",
  summary: "Work",
  description: "Work events and meetings",
  timeZone: "America/Los_Angeles",
  backgroundColor: "#4285f4",
  foregroundColor: "#ffffff",
  accessRole: "owner",
};

/**
 * Shared team calendar
 */
export const teamCalendar: calendar_v3.Schema$CalendarListEntry = {
  id: "team@group.calendar.google.com",
  summary: "Team Calendar",
  description: "Shared team events",
  timeZone: "America/New_York",
  backgroundColor: "#34a853",
  foregroundColor: "#ffffff",
  accessRole: "writer",
};

/**
 * Holidays calendar (read-only)
 */
export const holidaysCalendar: calendar_v3.Schema$CalendarListEntry = {
  id: "en.usa#holiday@group.v.calendar.google.com",
  summary: "Holidays in United States",
  timeZone: "America/Los_Angeles",
  backgroundColor: "#ea4335",
  foregroundColor: "#ffffff",
  accessRole: "reader",
};

/**
 * Hidden calendar
 */
export const hiddenCalendar: calendar_v3.Schema$CalendarListEntry = {
  id: "hidden@group.calendar.google.com",
  summary: "Hidden Calendar",
  description: "A hidden calendar",
  timeZone: "UTC",
  backgroundColor: "#666666",
  foregroundColor: "#ffffff",
  accessRole: "owner",
  hidden: true,
};

/**
 * All visible calendars
 */
export const visibleCalendars: calendar_v3.Schema$CalendarListEntry[] = [
  primaryCalendar,
  workCalendar,
  teamCalendar,
  holidaysCalendar,
];

/**
 * All calendars including hidden
 */
export const allCalendars: calendar_v3.Schema$CalendarListEntry[] = [
  ...visibleCalendars,
  hiddenCalendar,
];

/**
 * Get calendars as a map by ID
 */
export const calendarFixtures: Map<
  string,
  calendar_v3.Schema$CalendarListEntry
> = new Map(allCalendars.map((cal) => [cal.id ?? "", cal]));

/**
 * Google Calendar API wrapper for MCP Server
 */

import type { OAuth2Client } from "google-auth-library";
import type { calendar_v3 } from "googleapis";
import { google } from "googleapis";
import type { CalendarEvent, CalendarInfo } from "@/types.ts";

/**
 * Calendar API client interface
 */
export interface CalendarClient {
  listCalendars(showHidden?: boolean): Promise<CalendarInfo[]>;

  listEvents(
    calendarId: string,
    timeMin?: string,
    timeMax?: string,
    maxResults?: number,
    query?: string,
    singleEvents?: boolean,
    orderBy?: "startTime" | "updated"
  ): Promise<CalendarEvent[]>;

  getEvent(calendarId: string, eventId: string): Promise<CalendarEvent>;

  createEvent(
    calendarId: string,
    summary: string,
    start: string,
    end: string,
    description?: string,
    location?: string,
    attendees?: string[],
    timezone?: string,
    recurrence?: string[],
    addMeet?: boolean
  ): Promise<CalendarEvent>;
}

/**
 * Parse Calendar API calendar list entry into CalendarInfo structure
 * Exported for testing
 */
export function parseCalendar(
  calendar: calendar_v3.Schema$CalendarListEntry
): CalendarInfo {
  return {
    id: calendar.id || "",
    summary: calendar.summary || "",
    description: calendar.description ?? undefined,
    timeZone: calendar.timeZone ?? undefined,
    primary: calendar.primary ?? undefined,
    backgroundColor: calendar.backgroundColor ?? undefined,
    foregroundColor: calendar.foregroundColor ?? undefined,
    accessRole: calendar.accessRole ?? undefined,
  };
}

/**
 * Regex for all-day date format (YYYY-MM-DD)
 */
const ALL_DAY_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Detect if a date string is all-day format (YYYY-MM-DD) or datetime (RFC3339)
 * Exported for testing
 */
export function isAllDayDate(dateString: string): boolean {
  // All-day format: YYYY-MM-DD (10 characters, no time component)
  return ALL_DAY_DATE_REGEX.test(dateString);
}

/**
 * Parse event date/time
 */
function parseEventDateTime(
  datetime?: calendar_v3.Schema$EventDateTime
): CalendarEventDateTime {
  return {
    date: datetime?.date ?? undefined,
    dateTime: datetime?.dateTime ?? undefined,
    timeZone: datetime?.timeZone ?? undefined,
  };
}

/**
 * Parse event attendee
 */
function parseAttendee(
  attendee: calendar_v3.Schema$EventAttendee
): CalendarAttendee {
  return {
    email: attendee.email || "",
    displayName: attendee.displayName ?? undefined,
    responseStatus: attendee.responseStatus as
      | "needsAction"
      | "declined"
      | "tentative"
      | "accepted"
      | undefined,
    optional: attendee.optional ?? undefined,
    organizer: attendee.organizer ?? undefined,
    self: attendee.self ?? undefined,
  };
}

/**
 * Parse event person (creator/organizer)
 */
function parseEventPerson(person?: calendar_v3.Schema$Event["creator"]) {
  if (!person) {
    return undefined;
  }
  return {
    email: person.email || "",
    displayName: person.displayName ?? undefined,
  };
}

/**
 * Parse Calendar API event into CalendarEvent structure
 * Exported for testing
 */
export function parseEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  return {
    id: event.id || "",
    summary: event.summary || "(No title)",
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: parseEventDateTime(event.start),
    end: parseEventDateTime(event.end),
    attendees: event.attendees?.map(parseAttendee),
    creator: parseEventPerson(event.creator),
    organizer: parseEventPerson(event.organizer),
    status: event.status as "confirmed" | "tentative" | "cancelled" | undefined,
    htmlLink: event.htmlLink ?? undefined,
    hangoutLink: event.hangoutLink ?? undefined,
    recurrence: event.recurrence ?? undefined,
    recurringEventId: event.recurringEventId ?? undefined,
    created: event.created ?? undefined,
    updated: event.updated ?? undefined,
  };
}

/**
 * Create Calendar API client
 */
export function createCalendarClient(auth: OAuth2Client): CalendarClient {
  const calendar = google.calendar({ version: "v3", auth });

  return {
    /**
     * List all calendars for the authenticated user
     * @param showHidden Include hidden calendars (default: false)
     */
    async listCalendars(showHidden = false): Promise<CalendarInfo[]> {
      try {
        const response = await calendar.calendarList.list({
          showHidden,
        });

        const calendars = response.data.items || [];
        return calendars.map((cal) => parseCalendar(cal));
      } catch (error) {
        throw new Error(`Failed to list calendars: ${error}`);
      }
    },

    /**
     * List events from a calendar
     * @param calendarId Calendar ID (use "primary" for main calendar)
     * @param timeMin Lower bound (RFC3339 timestamp)
     * @param timeMax Upper bound (RFC3339 timestamp)
     * @param maxResults Maximum number of events (default: 10)
     * @param query Free text search query
     * @param singleEvents Expand recurring events (default: true)
     * @param orderBy Sort order (default: "startTime")
     */
    async listEvents(
      calendarId = "primary",
      timeMin?: string,
      timeMax?: string,
      maxResults = 10,
      query?: string,
      singleEvents = true,
      orderBy: "startTime" | "updated" = "startTime"
    ): Promise<CalendarEvent[]> {
      try {
        const response = await calendar.events.list({
          calendarId,
          timeMin,
          timeMax,
          maxResults,
          q: query,
          singleEvents,
          orderBy: singleEvents ? orderBy : undefined,
        });

        const events = response.data.items || [];
        return events.map((event) => parseEvent(event));
      } catch (error) {
        throw new Error(
          `Failed to list events from calendar ${calendarId}: ${error}`
        );
      }
    },

    /**
     * Get a single event by ID
     * @param calendarId Calendar ID
     * @param eventId Event ID
     */
    async getEvent(
      calendarId: string,
      eventId: string
    ): Promise<CalendarEvent> {
      try {
        const response = await calendar.events.get({
          calendarId,
          eventId,
        });

        return parseEvent(response.data);
      } catch (error) {
        throw new Error(
          `Failed to get event ${eventId} from calendar ${calendarId}: ${error}`
        );
      }
    },

    /**
     * Create a new event
     * @param calendarId Calendar ID (use "primary" for main calendar)
     * @param summary Event title
     * @param start Start time (RFC3339 or YYYY-MM-DD for all-day)
     * @param end End time (RFC3339 or YYYY-MM-DD for all-day)
     * @param description Event description
     * @param location Event location
     * @param attendees Array of attendee email addresses
     * @param timezone IANA timezone (e.g., "America/Los_Angeles")
     * @param recurrence Array of RRULE strings
     * @param addMeet Auto-create Google Meet link (default: false)
     */
    async createEvent(
      calendarId: string,
      summary: string,
      start: string,
      end: string,
      description?: string,
      location?: string,
      attendees?: string[],
      timezone?: string,
      recurrence?: string[],
      addMeet?: boolean
    ): Promise<CalendarEvent> {
      try {
        // Detect if this is an all-day event
        const isAllDay = isAllDayDate(start);

        const eventResource: calendar_v3.Schema$Event = {
          summary,
          description,
          location,
          start: isAllDay
            ? { date: start, timeZone: timezone }
            : { dateTime: start, timeZone: timezone },
          end: isAllDay
            ? { date: end, timeZone: timezone }
            : { dateTime: end, timeZone: timezone },
          attendees: attendees?.map((email) => ({ email })),
          recurrence,
        };

        // Add Google Meet conference if requested
        if (addMeet) {
          eventResource.conferenceData = {
            createRequest: {
              requestId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          };
        }

        const response = await calendar.events.insert({
          calendarId,
          requestBody: eventResource,
          conferenceDataVersion: addMeet ? 1 : undefined,
        });

        return parseEvent(response.data);
      } catch (error) {
        throw new Error(
          `Failed to create event "${summary}" in calendar ${calendarId}: ${error}`
        );
      }
    },
  };
}

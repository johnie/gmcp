/**
 * MSW handlers for Google Calendar API endpoints
 * Base URL: https://www.googleapis.com/calendar/v3
 */

import type { calendar_v3 } from "googleapis";
import { HttpResponse, http } from "msw";
import {
  allCalendars,
  allEvents,
  eventFixtures,
  visibleCalendars,
} from "../fixtures/index.ts";

const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

export const calendarHandlers = [
  /**
   * List calendars
   * GET /users/me/calendarList
   */
  http.get(`${CALENDAR_BASE}/users/me/calendarList`, ({ request }) => {
    const url = new URL(request.url);
    const showHidden = url.searchParams.get("showHidden") === "true";

    const calendars = showHidden ? allCalendars : visibleCalendars;

    const response: calendar_v3.Schema$CalendarList = {
      kind: "calendar#calendarList",
      items: calendars,
    };

    return HttpResponse.json(response);
  }),

  /**
   * List events
   * GET /calendars/:calendarId/events
   */
  http.get(`${CALENDAR_BASE}/calendars/:calendarId/events`, ({ request }) => {
    const url = new URL(request.url);
    const timeMin = url.searchParams.get("timeMin");
    const timeMax = url.searchParams.get("timeMax");
    const maxResults = Number(url.searchParams.get("maxResults") || "10");
    const query = url.searchParams.get("q");
    const singleEvents = url.searchParams.get("singleEvents") !== "false";
    const orderBy = url.searchParams.get("orderBy") || "startTime";

    let events = [...allEvents];

    // Filter by query if provided
    if (query) {
      events = events.filter(
        (event) =>
          event.summary?.toLowerCase().includes(query.toLowerCase()) ||
          event.description?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by time range
    if (timeMin) {
      const minDate = new Date(timeMin);
      events = events.filter((event) => {
        const start = event.start?.dateTime || event.start?.date;
        if (!start) {
          return true;
        }
        return new Date(start) >= minDate;
      });
    }

    if (timeMax) {
      const maxDate = new Date(timeMax);
      events = events.filter((event) => {
        const start = event.start?.dateTime || event.start?.date;
        if (!start) {
          return true;
        }
        return new Date(start) <= maxDate;
      });
    }

    // Sort by start time or updated
    if (singleEvents && orderBy === "startTime") {
      events.sort((a, b) => {
        const aStart = a.start?.dateTime || a.start?.date || "";
        const bStart = b.start?.dateTime || b.start?.date || "";
        return aStart.localeCompare(bStart);
      });
    } else if (orderBy === "updated") {
      events.sort((a, b) => {
        const aUpdated = a.updated || "";
        const bUpdated = b.updated || "";
        return bUpdated.localeCompare(aUpdated);
      });
    }

    // Limit results
    events = events.slice(0, maxResults);

    const response: calendar_v3.Schema$Events = {
      kind: "calendar#events",
      summary: "Test Calendar",
      items: events,
    };

    return HttpResponse.json(response);
  }),

  /**
   * Get single event
   * GET /calendars/:calendarId/events/:eventId
   */
  http.get(
    `${CALENDAR_BASE}/calendars/:calendarId/events/:eventId`,
    ({ params }) => {
      const { eventId } = params;

      const event = eventFixtures.get(eventId as string);

      if (!event) {
        return HttpResponse.json(
          {
            error: {
              code: 404,
              message: `Event not found: ${eventId}`,
              errors: [{ domain: "global", reason: "notFound" }],
            },
          },
          { status: 404 }
        );
      }

      return HttpResponse.json(event);
    }
  ),

  /**
   * Create event
   * POST /calendars/:calendarId/events
   */
  http.post(
    `${CALENDAR_BASE}/calendars/:calendarId/events`,
    async ({ request }) => {
      const url = new URL(request.url);
      const conferenceDataVersion = url.searchParams.get(
        "conferenceDataVersion"
      );
      const body = (await request.json()) as calendar_v3.Schema$Event;

      const createdEvent: calendar_v3.Schema$Event = {
        kind: "calendar#event",
        id: `event_${Date.now()}`,
        status: "confirmed",
        htmlLink: `https://calendar.google.com/event?eid=event_${Date.now()}`,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        summary: body.summary,
        description: body.description,
        location: body.location,
        start: body.start,
        end: body.end,
        attendees: body.attendees,
        recurrence: body.recurrence,
        creator: {
          email: "user@example.com",
        },
        organizer: {
          email: "user@example.com",
        },
      };

      // Add Google Meet if conference data was requested
      if (conferenceDataVersion === "1" && body.conferenceData?.createRequest) {
        createdEvent.hangoutLink = `https://meet.google.com/new-${Date.now()}`;
        createdEvent.conferenceData = {
          entryPoints: [
            {
              entryPointType: "video",
              uri: createdEvent.hangoutLink,
              label: createdEvent.hangoutLink.replace("https://", ""),
            },
          ],
          conferenceSolution: {
            key: { type: "hangoutsMeet" },
            name: "Google Meet",
          },
          createRequest: body.conferenceData.createRequest,
        };
      }

      return HttpResponse.json(createdEvent);
    }
  ),
];

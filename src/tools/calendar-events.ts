/**
 * Calendar events list tool for MCP Server
 */

import { z } from "zod";
import type { CalendarClient } from "@/calendar.ts";
import { OutputFormatSchema } from "@/schemas/shared.ts";
import { eventListToMarkdown } from "@/utils/markdown.ts";
import { createErrorResponse } from "@/utils/tool-helpers.ts";

/**
 * Input schema for calendar_list_events tool
 */
export const CalendarEventsInputSchema = z.object({
  calendar_id: z
    .string()
    .default("primary")
    .describe('Calendar ID to list events from (default: "primary")'),
  time_min: z
    .string()
    .optional()
    .describe(
      "Lower bound for event start time (RFC3339, e.g., 2024-01-01T00:00:00Z)"
    ),
  time_max: z
    .string()
    .optional()
    .describe(
      "Upper bound for event start time (RFC3339, e.g., 2024-12-31T23:59:59Z)"
    ),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(250)
    .default(10)
    .describe("Maximum number of events to return (default: 10, max: 250)"),
  query: z
    .string()
    .optional()
    .describe("Free text search query to filter events"),
  single_events: z
    .boolean()
    .default(true)
    .describe(
      "Expand recurring events into individual instances (default: true)"
    ),
  order_by: z
    .enum(["startTime", "updated"])
    .default("startTime")
    .describe('Sort order: "startTime" (default) or "updated"'),
  output_format: OutputFormatSchema,
});

export type CalendarEventsInput = z.infer<typeof CalendarEventsInputSchema>;

/**
 * Calendar events list tool implementation
 */
export async function calendarEventsTool(
  calendarClient: CalendarClient,
  params: CalendarEventsInput
) {
  try {
    const events = await calendarClient.listEvents(
      params.calendar_id,
      params.time_min,
      params.time_max,
      params.max_results,
      params.query,
      params.single_events,
      params.order_by
    );

    const output = {
      calendar_id: params.calendar_id,
      count: events.length,
      events: events.map((event) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        status: event.status,
        html_link: event.htmlLink,
        hangout_link: event.hangoutLink,
        attendees: event.attendees?.map((attendee) => ({
          email: attendee.email,
          display_name: attendee.displayName,
          response_status: attendee.responseStatus,
          optional: attendee.optional,
        })),
        creator: event.creator,
        organizer: event.organizer,
        recurrence: event.recurrence,
        recurring_event_id: event.recurringEventId,
      })),
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : eventListToMarkdown(output);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("listing calendar events", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const CALENDAR_EVENTS_DESCRIPTION = `List events from a Google Calendar with flexible filtering options.

This tool retrieves events from a specified calendar with support for time ranges, text search, and various filtering options.

**Parameters**:
- \`calendar_id\` (string, optional): Calendar ID (default: "primary" for main calendar)
- \`time_min\` (string, optional): Lower bound for event start time (RFC3339 timestamp)
- \`time_max\` (string, optional): Upper bound for event start time (RFC3339 timestamp)
- \`max_results\` (number, optional): Max events to return (1-250, default: 10)
- \`query\` (string, optional): Free text search to filter events
- \`single_events\` (boolean, optional): Expand recurring events (default: true)
- \`order_by\` (string, optional): Sort by "startTime" (default) or "updated"
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`calendar_id\`: The calendar ID used for the query
- \`count\`: Number of events returned
- \`events\`: Array of event objects containing:
  - \`id\`: Event ID
  - \`summary\`: Event title
  - \`description\`: Event description
  - \`location\`: Event location
  - \`start\`: Start time (date or dateTime with timezone)
  - \`end\`: End time (date or dateTime with timezone)
  - \`status\`: Event status (confirmed, tentative, cancelled)
  - \`html_link\`: Link to view event in Google Calendar
  - \`hangout_link\`: Google Meet link if available
  - \`attendees\`: List of attendees with response status
  - \`creator\`: Event creator information
  - \`organizer\`: Event organizer information
  - \`recurrence\`: RRULE array for recurring events
  - \`recurring_event_id\`: ID of recurring event series

**RFC3339 Timestamp Format**:
- Full datetime: \`2024-01-15T09:00:00-08:00\` or \`2024-01-15T17:00:00Z\`
- Note: Use timezone offset or Z for UTC

**Examples**:
- Next 10 events: \`{ "calendar_id": "primary" }\`
- Events this week: \`{ "time_min": "2024-01-15T00:00:00Z", "time_max": "2024-01-22T23:59:59Z" }\`
- Search meetings: \`{ "query": "standup" }\`
- Recent updates: \`{ "order_by": "updated", "max_results": 20 }\`
- From shared calendar: \`{ "calendar_id": "team@example.com" }\`
- JSON output: \`{ "output_format": "json" }\`

**Common Use Cases**:
- View upcoming events for today/week/month
- Search for specific meetings or topics
- Get event IDs for modification
- Check availability and schedules
- Monitor recently updated events

**Error Handling**:
- Returns error if authentication fails
- Returns error if calendar doesn't exist or not accessible
- Returns error if Calendar API request fails
- Returns empty array if no events match filters`;

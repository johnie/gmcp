/**
 * Calendar get event tool for MCP Server
 */

import { z } from "zod";
import type { CalendarClient } from "@/calendar.ts";
import { eventToMarkdown } from "@/utils/markdown.ts";
import { createErrorResponse } from "@/utils/tool-helpers.ts";

/**
 * Input schema for calendar_get_event tool
 */
export const CalendarGetEventInputSchema = z.object({
  calendar_id: z
    .string()
    .default("primary")
    .describe('Calendar ID (default: "primary")'),
  event_id: z
    .string()
    .min(1, "Event ID is required")
    .describe("Event ID to retrieve"),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type CalendarGetEventInput = z.infer<typeof CalendarGetEventInputSchema>;

/**
 * Calendar get event tool implementation
 */
export async function calendarGetEventTool(
  calendarClient: CalendarClient,
  params: CalendarGetEventInput
) {
  try {
    const event = await calendarClient.getEvent(
      params.calendar_id,
      params.event_id
    );

    const output = {
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
        organizer: attendee.organizer,
        self: attendee.self,
      })),
      creator: event.creator,
      organizer: event.organizer,
      recurrence: event.recurrence,
      recurring_event_id: event.recurringEventId,
      created: event.created,
      updated: event.updated,
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : eventToMarkdown(output);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse(
      `getting event ${params.event_id} from calendar ${params.calendar_id}`,
      error
    );
  }
}

/**
 * Tool description for MCP server registration
 */
export const CALENDAR_GET_EVENT_DESCRIPTION = `Get detailed information about a specific calendar event by ID.

This tool retrieves complete details for a single event, including all attendees, recurrence rules, and metadata.

**Parameters**:
- \`calendar_id\` (string, optional): Calendar ID (default: "primary")
- \`event_id\` (string, required): Event ID to retrieve
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
Complete event object containing:
- \`id\`: Event ID
- \`summary\`: Event title
- \`description\`: Full event description
- \`location\`: Event location
- \`start\`: Start time (date or dateTime with timezone)
- \`end\`: End time (date or dateTime with timezone)
- \`status\`: Event status (confirmed, tentative, cancelled)
- \`html_link\`: Link to view/edit event in Google Calendar
- \`hangout_link\`: Google Meet link if available
- \`attendees\`: Complete attendee list with:
  - \`email\`: Attendee email address
  - \`display_name\`: Attendee name
  - \`response_status\`: needsAction, declined, tentative, or accepted
  - \`optional\`: Whether attendance is optional
  - \`organizer\`: Whether this attendee is the organizer
  - \`self\`: Whether this is the authenticated user
- \`creator\`: Event creator (email and display name)
- \`organizer\`: Event organizer (email and display name)
- \`recurrence\`: RRULE array for recurring events
- \`recurring_event_id\`: Parent event ID if this is a recurring instance
- \`created\`: Event creation timestamp
- \`updated\`: Last update timestamp

**Examples**:
- Get event from primary calendar: \`{ "event_id": "abc123xyz" }\`
- Get from shared calendar: \`{ "calendar_id": "team@example.com", "event_id": "abc123xyz" }\`
- JSON output: \`{ "event_id": "abc123xyz", "output_format": "json" }\`

**Common Use Cases**:
- View full event details including description
- Check attendee responses
- Get Google Meet link for a meeting
- Retrieve recurrence rules
- Check event metadata (created/updated times)

**Error Handling**:
- Returns error if authentication fails
- Returns error if event doesn't exist
- Returns error if calendar not accessible
- Returns error if Calendar API request fails`;

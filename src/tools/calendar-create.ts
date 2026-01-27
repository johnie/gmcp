/**
 * Calendar create event tool for MCP Server
 */

import { z } from "zod";
import type { CalendarClient } from "@/calendar.ts";
import { eventToMarkdown } from "@/utils/markdown.ts";
import { createErrorResponse } from "@/utils/tool-helpers.ts";

/**
 * Input schema for calendar_create_event tool
 */
export const CalendarCreateEventInputSchema = z.object({
  calendar_id: z
    .string()
    .default("primary")
    .describe('Calendar ID to create event in (default: "primary")'),
  summary: z
    .string()
    .min(1, "Event title is required")
    .describe("Event title/summary (required)"),
  start: z
    .string()
    .min(1, "Start time is required")
    .describe(
      'Start time: RFC3339 (e.g., "2024-01-15T09:00:00-08:00") or date for all-day (e.g., "2024-01-15")'
    ),
  end: z
    .string()
    .min(1, "End time is required")
    .describe(
      'End time: RFC3339 (e.g., "2024-01-15T10:00:00-08:00") or date for all-day (e.g., "2024-01-15")'
    ),
  description: z.string().optional().describe("Event description (optional)"),
  location: z.string().optional().describe("Event location (optional)"),
  attendees: z
    .array(z.string().email())
    .optional()
    .describe("Array of attendee email addresses (optional)"),
  timezone: z
    .string()
    .optional()
    .describe('IANA timezone (e.g., "America/Los_Angeles", optional)'),
  recurrence: z
    .array(z.string())
    .optional()
    .describe(
      'Recurrence rules as RRULE strings (e.g., ["RRULE:FREQ=WEEKLY;COUNT=10"], optional)'
    ),
  add_meet: z
    .boolean()
    .default(false)
    .describe("Auto-create Google Meet conference link (default: false)"),
  confirm: z
    .boolean()
    .default(false)
    .describe("Must be true to create the event (safety check)"),
  output_format: z
    .enum(["markdown", "json"])
    .default("markdown")
    .describe("Output format: markdown (default) or json"),
});

export type CalendarCreateEventInput = z.infer<
  typeof CalendarCreateEventInputSchema
>;

/**
 * Calendar create event tool implementation
 */
export async function calendarCreateEventTool(
  calendarClient: CalendarClient,
  params: CalendarCreateEventInput
) {
  // Safety check: require explicit confirmation
  if (!params.confirm) {
    return {
      content: [
        {
          type: "text" as const,
          text: "❌ Event creation requires explicit confirmation. Please set `confirm: true` in the parameters to proceed.\n\nThis safety measure prevents accidental event creation.",
        },
      ],
      structuredContent: {
        error: "Confirmation required",
        message:
          "Set confirm: true to create the event. This prevents accidental creation.",
      },
    };
  }

  try {
    const event = await calendarClient.createEvent(
      params.calendar_id,
      params.summary,
      params.start,
      params.end,
      params.description,
      params.location,
      params.attendees,
      params.timezone,
      params.recurrence,
      params.add_meet
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
      })),
      organizer: event.organizer,
      recurrence: event.recurrence,
      created: event.created,
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : eventToMarkdown(output, "Event created successfully!");

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse(
      `creating event "${params.summary}" in calendar ${params.calendar_id}`,
      error
    );
  }
}

/**
 * Tool description for MCP server registration
 */
export const CALENDAR_CREATE_EVENT_DESCRIPTION = `Create a new event in Google Calendar.

This tool creates a new calendar event with support for attendees, recurring events, Google Meet links, and more.

**IMPORTANT**: You must set \`confirm: true\` to create the event. This prevents accidental event creation.

**Parameters**:
- \`calendar_id\` (string, optional): Calendar ID (default: "primary")
- \`summary\` (string, required): Event title
- \`start\` (string, required): Start time (see formats below)
- \`end\` (string, required): End time (see formats below)
- \`description\` (string, optional): Event description
- \`location\` (string, optional): Event location
- \`attendees\` (array, optional): Array of attendee email addresses
- \`timezone\` (string, optional): IANA timezone (e.g., "America/Los_Angeles")
- \`recurrence\` (array, optional): RRULE strings for recurring events
- \`add_meet\` (boolean, optional): Auto-create Google Meet link (default: false)
- \`confirm\` (boolean, required): Must be true to create event (safety check)
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Time Formats**:
- **Timed event**: RFC3339 with timezone
  - \`"2024-01-15T09:00:00-08:00"\` (Pacific Time)
  - \`"2024-01-15T17:00:00Z"\` (UTC)
- **All-day event**: Date only (YYYY-MM-DD)
  - \`"2024-01-15"\` (all day)

**Recurrence Examples**:
- Weekly for 10 weeks: \`["RRULE:FREQ=WEEKLY;COUNT=10"]\`
- Daily on weekdays: \`["RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"]\`
- Monthly on 15th: \`["RRULE:FREQ=MONTHLY;BYMONTHDAY=15"]\`

**Returns**:
Created event object containing:
- \`id\`: Event ID (use for updates/deletes)
- \`summary\`: Event title
- \`start\`/\`end\`: Event times
- \`html_link\`: Link to view in Google Calendar
- \`hangout_link\`: Google Meet link (if add_meet was true)
- \`attendees\`: List of attendees
- All other event details

**Examples**:
- Simple event:
  \`\`\`json
  {
    "summary": "Team Meeting",
    "start": "2024-01-15T14:00:00-08:00",
    "end": "2024-01-15T15:00:00-08:00",
    "confirm": true
  }
  \`\`\`

- All-day event:
  \`\`\`json
  {
    "summary": "Conference",
    "start": "2024-01-20",
    "end": "2024-01-21",
    "location": "San Francisco",
    "confirm": true
  }
  \`\`\`

- Meeting with attendees and Google Meet:
  \`\`\`json
  {
    "summary": "Sprint Planning",
    "start": "2024-01-15T10:00:00-08:00",
    "end": "2024-01-15T11:30:00-08:00",
    "description": "Q1 sprint planning session",
    "attendees": ["alice@example.com", "bob@example.com"],
    "add_meet": true,
    "confirm": true
  }
  \`\`\`

- Recurring weekly meeting:
  \`\`\`json
  {
    "summary": "Weekly Standup",
    "start": "2024-01-15T09:00:00-08:00",
    "end": "2024-01-15T09:30:00-08:00",
    "recurrence": ["RRULE:FREQ=WEEKLY;COUNT=10"],
    "add_meet": true,
    "confirm": true
  }
  \`\`\`

**Common Use Cases**:
- Create meetings with automatic Google Meet links
- Schedule recurring events (daily standups, weekly meetings)
- Create all-day events for conferences or holidays
- Add attendees to events
- Schedule events in shared calendars

**Error Handling**:
- Returns error if confirm is not true
- Returns error if authentication fails
- Returns error if calendar not accessible
- Returns error if time format is invalid
- Returns error if Calendar API request fails`;

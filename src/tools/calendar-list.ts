/**
 * Calendar list tool for MCP Server
 */

import { z } from "zod";
import type { CalendarClient } from "@/calendar.ts";
import { OutputFormatSchema } from "@/schemas/shared.ts";
import { calendarListToMarkdown } from "@/utils/markdown.ts";
import { createErrorResponse } from "@/utils/tool-helpers.ts";

/**
 * Input schema for calendar_list_calendars tool
 */
export const CalendarListInputSchema = z.object({
  show_hidden: z
    .boolean()
    .default(false)
    .describe("Include hidden calendars in the results (default: false)"),
  output_format: OutputFormatSchema,
});

export type CalendarListInput = z.infer<typeof CalendarListInputSchema>;

/**
 * Calendar list tool implementation
 */
export async function calendarListTool(
  calendarClient: CalendarClient,
  params: CalendarListInput
) {
  try {
    const calendars = await calendarClient.listCalendars(params.show_hidden);

    const output = {
      count: calendars.length,
      calendars: calendars.map((cal) => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        timezone: cal.timeZone,
        primary: cal.primary,
        access_role: cal.accessRole,
        background_color: cal.backgroundColor,
        foreground_color: cal.foregroundColor,
      })),
    };

    const textContent =
      params.output_format === "json"
        ? JSON.stringify(output, null, 2)
        : calendarListToMarkdown(output);

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    return createErrorResponse("listing calendars", error);
  }
}

/**
 * Tool description for MCP server registration
 */
export const CALENDAR_LIST_DESCRIPTION = `List all calendars for the authenticated Google account.

This tool retrieves all calendars accessible by the authenticated user, including their primary calendar, shared calendars, and subscribed calendars.

**Parameters**:
- \`show_hidden\` (boolean, optional): Include hidden calendars (default: false)
- \`output_format\` (string, optional): Output format: "markdown" (default) or "json"

**Returns**:
- \`count\`: Number of calendars found
- \`calendars\`: Array of calendar objects containing:
  - \`id\`: Calendar ID (use this for other calendar operations)
  - \`summary\`: Calendar name/title
  - \`description\`: Calendar description
  - \`timezone\`: Calendar timezone (IANA format)
  - \`primary\`: Whether this is the user's primary calendar
  - \`access_role\`: User's access level (owner, writer, reader, freeBusyReader)
  - \`background_color\`: Calendar background color (hex)
  - \`foreground_color\`: Calendar foreground color (hex)

**Examples**:
- List visible calendars: \`{ "show_hidden": false }\`
- List all calendars including hidden: \`{ "show_hidden": true }\`
- JSON output: \`{ "output_format": "json" }\`

**Common Use Cases**:
- Get calendar IDs for use with other calendar tools
- Discover shared calendars
- Verify calendar access permissions

**Error Handling**:
- Returns error if authentication fails
- Returns error if Calendar API request fails`;

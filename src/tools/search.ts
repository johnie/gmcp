/**
 * Gmail search tool for MCP Server
 */

import { z } from "zod";
import type { GmailClient } from "@/gmail.ts";

/**
 * Input schema for gmail_search_emails tool
 */
export const SearchEmailsInputSchema = z.object({
  query: z
    .string()
    .min(1, "Query cannot be empty")
    .describe(
      'Gmail search query using Gmail search syntax (e.g., "from:user@example.com subject:test is:unread")'
    ),
  max_results: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(10)
    .describe("Maximum number of emails to return (default: 10, max: 100)"),
  include_body: z
    .boolean()
    .default(false)
    .describe("Whether to include full email body in results (default: false)"),
  page_token: z
    .string()
    .optional()
    .describe("Token for pagination to fetch next page of results"),
});

export type SearchEmailsInput = z.infer<typeof SearchEmailsInputSchema>;

/**
 * Format email for structured output
 */
function formatEmailForOutput(email: {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
  labels?: string[];
}) {
  return {
    id: email.id,
    thread_id: email.threadId,
    subject: email.subject,
    from: email.from,
    to: email.to,
    date: email.date,
    snippet: email.snippet,
    ...(email.body ? { body: email.body } : {}),
    ...(email.labels ? { labels: email.labels } : {}),
  };
}

/**
 * Generate markdown for a single email
 */
function generateEmailMarkdown(email: {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
  labels?: string[];
}): string[] {
  const lines: string[] = [];

  lines.push(`## ${email.subject}`);
  lines.push(`- **From**: ${email.from}`);
  lines.push(`- **To**: ${email.to}`);
  lines.push(`- **Date**: ${email.date}`);
  lines.push(`- **ID**: ${email.id}`);
  lines.push(`- **Thread ID**: ${email.threadId}`);

  if (email.labels && email.labels.length > 0) {
    lines.push(`- **Labels**: ${email.labels.join(", ")}`);
  }

  lines.push("");
  lines.push(`**Snippet**: ${email.snippet}`);

  if (email.body) {
    lines.push("");
    lines.push("**Body**:");
    lines.push("```");
    const bodyPreview =
      email.body.length > 500
        ? `${email.body.substring(0, 500)}...`
        : email.body;
    lines.push(bodyPreview);
    lines.push("```");
  }

  lines.push("");
  lines.push("---");
  lines.push("");

  return lines;
}

/**
 * Gmail search emails tool implementation
 */
export async function searchEmailsTool(
  gmailClient: GmailClient,
  params: SearchEmailsInput
) {
  try {
    const result = await gmailClient.searchEmails(
      params.query,
      params.max_results,
      params.include_body,
      params.page_token
    );

    // Format output
    const output = {
      total_estimate: result.total_estimate,
      count: result.emails.length,
      has_more: result.has_more,
      ...(result.next_page_token
        ? { next_page_token: result.next_page_token }
        : {}),
      emails: result.emails.map(formatEmailForOutput),
    };

    // Format as markdown for readability
    const lines: string[] = [
      `# Gmail Search Results: "${params.query}"`,
      "",
      `Found approximately ${result.total_estimate} emails (showing ${result.emails.length})`,
      "",
    ];

    if (result.emails.length === 0) {
      lines.push("No emails found matching the query.");
    } else {
      for (const email of result.emails) {
        lines.push(...generateEmailMarkdown(email));
      }

      if (result.has_more) {
        lines.push("");
        lines.push(
          `**Note**: More results available. Use page_token: "${result.next_page_token}" to fetch the next page.`
        );
      }
    }

    const textContent = lines.join("\n");

    return {
      content: [{ type: "text" as const, text: textContent }],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text" as const,
          text: `Error searching emails: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Tool description for MCP server registration
 */
export const SEARCH_EMAILS_DESCRIPTION = `Search for emails in Gmail using Gmail's search syntax.

This tool allows you to search through your Gmail messages using the same query syntax available in Gmail's web interface. It supports various search operators and returns structured results with email metadata.

**Gmail Search Operators**:
- \`from:user@example.com\` - emails from specific sender
- \`to:user@example.com\` - emails to specific recipient  - \`subject:keyword\` - emails with keyword in subject
- \`is:unread\` - unread emails
- \`is:starred\` - starred emails
- \`has:attachment\` - emails with attachments
- \`after:2024/01/01\` - emails after date
- \`before:2024/12/31\` - emails before date
- \`label:labelname\` - emails with specific label
- \`filename:pdf\` - emails with specific file type
- \`larger:5M\` - emails larger than size
- \`newer_than:7d\` - emails newer than duration

**Combining Operators**:
- Use \`AND\`, \`OR\`, and \`-\` (NOT) to combine operators
- Example: \`from:boss@example.com is:unread -label:archive\`

**Parameters**:
- \`query\` (string, required): Gmail search query
- \`max_results\` (number, optional): Max emails to return (1-100, default: 10)
- \`include_body\` (boolean, optional): Include full email body (default: false, only snippet)
- \`page_token\` (string, optional): Pagination token for next page

**Returns**:
- \`total_estimate\`: Approximate total matching emails
- \`count\`: Number of emails in this response
- \`has_more\`: Whether more results are available
- \`next_page_token\`: Token for fetching next page (if has_more is true)
- \`emails\`: Array of email objects with id, thread_id, subject, from, to, date, snippet, and optionally body

**Examples**:
- Search unread emails: \`{ "query": "is:unread" }\`
- Search by sender: \`{ "query": "from:alerts@service.com" }\`
- Recent attachments: \`{ "query": "has:attachment newer_than:7d" }\`
- With body: \`{ "query": "subject:invoice", "include_body": true }\`

**Error Handling**:
- Returns error message if authentication fails
- Returns error if Gmail API request fails
- Empty results if no emails match the query`;

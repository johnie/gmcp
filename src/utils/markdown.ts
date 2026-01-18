/**
 * Markdown formatting utilities using json2md
 */

import json2md from "json2md";

/**
 * Email data structure for markdown conversion
 */
interface EmailData {
  id: string;
  thread_id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  body?: string;
  labels?: string[];
}

/**
 * Search results structure
 */
interface SearchResultData {
  total_estimate: number;
  count: number;
  has_more: boolean;
  next_page_token?: string;
  emails: EmailData[];
}

/**
 * Convert a single email to json2md format
 */
function emailToJson2md(email: EmailData) {
  const elements: json2md.DataObject[] = [
    { h2: email.subject },
    {
      ul: [
        `**From**: ${email.from}`,
        `**To**: ${email.to}`,
        `**Date**: ${email.date}`,
        `**ID**: ${email.id}`,
        `**Thread ID**: ${email.thread_id}`,
        ...(email.labels && email.labels.length > 0
          ? [`**Labels**: ${email.labels.join(", ")}`]
          : []),
      ],
    },
    { p: `**Snippet**: ${email.snippet}` },
  ];

  if (email.body) {
    const bodyPreview =
      email.body.length > 500
        ? `${email.body.substring(0, 500)}...`
        : email.body;
    elements.push({ p: "**Body**:" }, { code: { content: bodyPreview } });
  }

  elements.push({ hr: "" });

  return elements;
}

/**
 * Convert search results to Markdown using json2md
 */
export function searchResultsToMarkdown(
  query: string,
  data: SearchResultData
): string {
  const elements: json2md.DataObject[] = [
    { h1: `Gmail Search Results: "${query}"` },
    {
      p: `Found approximately ${data.total_estimate} emails (showing ${data.count})`,
    },
  ];

  if (data.emails.length === 0) {
    elements.push({ p: "No emails found matching the query." });
  } else {
    for (const email of data.emails) {
      elements.push(...emailToJson2md(email));
    }

    if (data.has_more && data.next_page_token) {
      elements.push({
        p: `**Note**: More results available. Use page_token: "${data.next_page_token}" to fetch the next page.`,
      });
    }
  }

  return json2md(elements);
}

/**
 * Gmail label fixtures for MSW handlers
 */

import type { gmail_v1 } from "googleapis";

/**
 * System labels
 */
export const inboxLabel: gmail_v1.Schema$Label = {
  id: "INBOX",
  name: "INBOX",
  type: "system",
  messageListVisibility: "show",
  labelListVisibility: "labelShow",
  messagesTotal: 150,
  messagesUnread: 23,
};

export const sentLabel: gmail_v1.Schema$Label = {
  id: "SENT",
  name: "SENT",
  type: "system",
  messageListVisibility: "show",
  labelListVisibility: "labelShow",
  messagesTotal: 89,
  messagesUnread: 0,
};

export const trashLabel: gmail_v1.Schema$Label = {
  id: "TRASH",
  name: "TRASH",
  type: "system",
  messageListVisibility: "hide",
  labelListVisibility: "labelHide",
  messagesTotal: 5,
  messagesUnread: 0,
};

export const unreadLabel: gmail_v1.Schema$Label = {
  id: "UNREAD",
  name: "UNREAD",
  type: "system",
  messagesTotal: 23,
  messagesUnread: 23,
};

export const importantLabel: gmail_v1.Schema$Label = {
  id: "IMPORTANT",
  name: "IMPORTANT",
  type: "system",
  messageListVisibility: "show",
  labelListVisibility: "labelShow",
  messagesTotal: 42,
  messagesUnread: 7,
};

/**
 * User-created labels
 */
export const workLabel: gmail_v1.Schema$Label = {
  id: "Label_1",
  name: "Work",
  type: "user",
  messageListVisibility: "show",
  labelListVisibility: "labelShow",
  messagesTotal: 67,
  messagesUnread: 12,
  color: {
    textColor: "#ffffff",
    backgroundColor: "#4285f4",
  },
};

export const personalLabel: gmail_v1.Schema$Label = {
  id: "Label_2",
  name: "Personal",
  type: "user",
  messageListVisibility: "show",
  labelListVisibility: "labelShow",
  messagesTotal: 34,
  messagesUnread: 2,
  color: {
    textColor: "#000000",
    backgroundColor: "#ffd700",
  },
};

export const urgentLabel: gmail_v1.Schema$Label = {
  id: "Label_3",
  name: "Urgent",
  type: "user",
  messageListVisibility: "show",
  labelListVisibility: "labelShowIfUnread",
  messagesTotal: 8,
  messagesUnread: 5,
  color: {
    textColor: "#ffffff",
    backgroundColor: "#ea4335",
  },
};

export const nestedLabel: gmail_v1.Schema$Label = {
  id: "Label_4",
  name: "Work/Projects",
  type: "user",
  messageListVisibility: "show",
  labelListVisibility: "labelShow",
  messagesTotal: 21,
  messagesUnread: 3,
};

/**
 * All labels combined
 */
export const allLabels: gmail_v1.Schema$Label[] = [
  inboxLabel,
  sentLabel,
  trashLabel,
  unreadLabel,
  importantLabel,
  workLabel,
  personalLabel,
  urgentLabel,
  nestedLabel,
];

/**
 * Get labels as a map by ID
 */
export const labelFixtures: Map<string, gmail_v1.Schema$Label> = new Map(
  allLabels.map((label) => [label.id ?? "", label])
);

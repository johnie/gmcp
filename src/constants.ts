/**
 * Application-wide constants
 */

/**
 * Body preview length for email displays
 */
export const BODY_PREVIEW_LENGTH = 500;

/**
 * Default maximum results for search queries
 */
export const DEFAULT_MAX_RESULTS = 10;

/**
 * Maximum results limit for search queries
 */
export const MAX_RESULTS_LIMIT = 100;

/**
 * Maximum batch size for batch operations
 */
export const MAX_BATCH_SIZE = 1000;

/**
 * Email fetch batch size for rate limiting
 * Number of emails to fetch concurrently when retrieving search results
 */
export const EMAIL_FETCH_BATCH_SIZE = 10;

/**
 * Gmail system labels (cannot be deleted)
 * Includes core system labels and category labels
 */
export const GMAIL_SYSTEM_LABELS = [
  "INBOX",
  "SENT",
  "DRAFT",
  "TRASH",
  "SPAM",
  "STARRED",
  "IMPORTANT",
  "UNREAD",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
] as const;

/**
 * Gmail core system labels (cannot be renamed)
 * Subset of system labels that have rename restrictions
 */
export const GMAIL_CORE_SYSTEM_LABELS = [
  "INBOX",
  "SENT",
  "DRAFT",
  "TRASH",
  "SPAM",
  "STARRED",
  "IMPORTANT",
  "UNREAD",
] as const;

/**
 * Type for Gmail system labels
 */
export type GmailSystemLabel = (typeof GMAIL_SYSTEM_LABELS)[number];

/**
 * Type for Gmail core system labels
 */
export type GmailCoreSystemLabel = (typeof GMAIL_CORE_SYSTEM_LABELS)[number];

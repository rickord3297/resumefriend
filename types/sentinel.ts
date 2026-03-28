/**
 * Email classification from Sentinel LLM / inbox scan
 */
export type EmailClassification =
  | "Interview Request"
  | "Rejection"
  | "Follow-up"
  | "Status Update";

/** How the recruiter / email reads emotionally for the job seeker */
export type EmailSentiment = "positive" | "neutral" | "negative" | "mixed";

export interface ClassifiedEmail {
  threadId: string;
  messageId: string;
  snippet: string;
  from: string;
  subject: string;
  classification: EmailClassification;
  classifiedAt: string; // ISO
  sentiment?: EmailSentiment;
  /** Short line for activity feed / dashboard */
  summary?: string;
}

/** Latest inbox intelligence shown on the dashboard (persisted). */
export interface InboxSignal {
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  classification: EmailClassification;
  sentiment: EmailSentiment;
  summary: string;
  scannedAt: string;
  /** If the model inferred a concrete start time from the email body */
  suggestedEventStart?: string;
  suggestedEventTitle?: string;
}

/**
 * Prep Mode window: 30 minutes before an Interview calendar event.
 * Stored in Dashboard state so the UI can show "Prep Mode" during this window.
 */
export interface PrepModeWindow {
  id: string;
  calendarEventId: string;
  eventTitle: string;
  eventStart: string;   // ISO
  prepStart: string;   // ISO (eventStart - 30 min)
  prepEnd: string;     // ISO (same as eventStart)
}

/**
 * User's calendar availability for suggesting reply times (Action Engine).
 */
export interface CalendarAvailability {
  /** Typical available weekdays, e.g. ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] */
  weekdays?: string[];
  /** Preferred time window per day, e.g. { start: "09:00", end: "17:00" } in local time */
  window?: { start: string; end: string };
  /** Timezone, e.g. "America/Los_Angeles" */
  timezone?: string;
  /** Blocked dates (ISO date strings) */
  blockedDates?: string[];
  /** Optional notes for the LLM when generating reply */
  notes?: string;
}

/**
 * Dashboard state: persisted and consumed by the Dashboard UI.
 * Sentinel writes Prep Mode windows here when it finds Interview events.
 */
export interface DashboardState {
  prepModeWindows: PrepModeWindow[];
  lastUpdated: string; // ISO
  /** Gmail-derived classifications + sentiment (Smart Calendar / inbox strip). */
  inboxSignals: InboxSignal[];
  lastInboxScanAt?: string;
  /** Set only on GET /api/dashboard/state when demo seeding is allowed. */
  demoSeedAllowed?: boolean;
  /** Set only on GET /api/dashboard/state when Gmail scan is available. */
  inboxScanAvailable?: boolean;
}

/**
 * Sentinel – background service for Resume Friend
 *
 * - Email: Gmail API watch/poll → LLM classifies as Interview Request | Rejection | Follow-up
 * - Calendar: Google Calendar → Interview events create Prep Mode windows (30 min prior) in Dashboard state
 * - Action Engine: Interview Request emails → suggested reply from CalendarAvailability → save as draft
 */

import { getThreadDetails, listHistorySince, getCurrentHistoryId } from "./gmail";
import { classifyEmailInsight } from "./classifier";
import { syncInterviewPrepWindows } from "./calendar";
import { generateAndSaveDraft } from "./action-engine";
import { getDashboardState } from "@/lib/dashboard-store";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { CalendarAvailability } from "@/types/sentinel";
import type { ClassifiedEmail } from "@/types/sentinel";

const HISTORY_ID_FILE = path.join(process.cwd(), "data", "gmail-history-id.txt");

async function getStoredHistoryId(): Promise<string> {
  try {
    const id = await readFile(HISTORY_ID_FILE, "utf-8");
    return id.trim() || "0";
  } catch {
    return "0";
  }
}

async function setStoredHistoryId(id: string): Promise<void> {
  const { mkdir } = await import("fs/promises");
  await mkdir(path.dirname(HISTORY_ID_FILE), { recursive: true });
  await writeFile(HISTORY_ID_FILE, id, "utf-8");
}

export interface SentinelRunOptions {
  /** User's calendar availability for suggested replies (Action Engine). */
  calendarAvailability?: CalendarAvailability;
  /** If true, only run calendar sync (prep windows). Default false. */
  calendarOnly?: boolean;
  /** If true, only process Gmail (classify + drafts). Default false. */
  gmailOnly?: boolean;
}

export interface SentinelRunResult {
  prepModeWindowsAdded: number;
  emailsClassified: ClassifiedEmail[];
  draftsCreated: number;
  historyId: string;
  error?: string;
}

/**
 * Run one Sentinel cycle: sync calendar for Prep Mode, poll Gmail for new threads,
 * classify emails, and for Interview Requests create drafts using CalendarAvailability.
 */
export async function runSentinel(options: SentinelRunOptions = {}): Promise<SentinelRunResult> {
  const result: SentinelRunResult = {
    prepModeWindowsAdded: 0,
    emailsClassified: [],
    draftsCreated: 0,
    historyId: "",
  };

  try {
    if (!options.calendarOnly) {
      const historyId = await getStoredHistoryId();
      const current = historyId === "0" ? await getCurrentHistoryId() : historyId;
      const { threadIds, historyId: newHistoryId } = await listHistorySince(current);
      result.historyId = newHistoryId;
      await setStoredHistoryId(newHistoryId);

      for (const threadId of threadIds) {
        const details = await getThreadDetails(threadId);
        if (!details) continue;
        const insight = await classifyEmailInsight({
          snippet: details.snippet,
          from: details.from,
          subject: details.subject,
        });
        const classified: ClassifiedEmail = {
          ...details,
          classification: insight.classification,
          classifiedAt: new Date().toISOString(),
          sentiment: insight.sentiment,
          summary: insight.summary,
        };
        result.emailsClassified.push(classified);

        if (insight.classification === "Interview Request" && options.calendarAvailability) {
          const { draftId } = await generateAndSaveDraft({
            threadId: details.threadId,
            subject: details.subject,
            from: details.from,
            emailSnippet: details.snippet,
            calendarAvailability: options.calendarAvailability,
          });
          if (draftId) result.draftsCreated += 1;
        }
      }
    }

    if (!options.gmailOnly) {
      const added = await syncInterviewPrepWindows();
      result.prepModeWindowsAdded = added.length;
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  return result;
}

/**
 * Return current dashboard state (for API / Dashboard UI).
 */
export async function getSentinelDashboardState() {
  return getDashboardState();
}

export {
  watchGmail,
  getCurrentHistoryId,
  listHistorySince,
  getThreadDetails,
  createDraftReply,
} from "./gmail";
export { classifyEmail, classifyEmailInsight } from "./classifier";
export { syncInterviewPrepWindows, getCalendarClient } from "./calendar";
export { generateAndSaveDraft } from "./action-engine";
export { sentinelConfig, isGoogleConfigured, isOpenAIConfigured } from "./config";

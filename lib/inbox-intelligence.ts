import { getDashboardState, setDashboardState } from "@/lib/dashboard-store";
import { getThreadDetails, listRecentInboxThreads } from "@/lib/sentinel/gmail";
import { classifyEmailInsight } from "@/lib/sentinel/classifier";
import { isGoogleConfigured } from "@/lib/sentinel/config";
import type { InboxSignal } from "@/types/sentinel";
import { addActivity } from "@/lib/analytics-store";

const MAX_THREADS_PER_SCAN = 12;

export interface InboxScanResult {
  scanned: number;
  signals: InboxSignal[];
  error?: string;
}

/**
 * Pull recent inbox threads, classify + sentiment, persist to dashboard state.
 */
export async function scanInboxAndPersist(maxThreads = MAX_THREADS_PER_SCAN): Promise<InboxScanResult> {
  if (!isGoogleConfigured()) {
    return { scanned: 0, signals: [], error: "Gmail is not configured (Google OAuth env vars)." };
  }

  let threadIds: string[];
  try {
    threadIds = await listRecentInboxThreads(maxThreads);
  } catch (e) {
    return {
      scanned: 0,
      signals: [],
      error: e instanceof Error ? e.message : "Failed to list inbox threads",
    };
  }

  const signals: InboxSignal[] = [];
  const now = new Date().toISOString();

  for (const threadId of threadIds) {
    try {
      const details = await getThreadDetails(threadId);
      if (!details) continue;
      const insight = await classifyEmailInsight({
        snippet: details.snippet,
        from: details.from,
        subject: details.subject,
      });
      signals.push({
        threadId: details.threadId,
        subject: details.subject,
        from: details.from,
        snippet: details.snippet,
        classification: insight.classification,
        sentiment: insight.sentiment,
        summary: insight.summary,
        scannedAt: now,
        suggestedEventStart: insight.suggestedStartIso ?? undefined,
        suggestedEventTitle: insight.suggestedEventTitle ?? undefined,
      });
    } catch {
      continue;
    }
  }

  signals.sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));

  const state = await getDashboardState();
  state.inboxSignals = signals;
  state.lastInboxScanAt = now;
  state.lastUpdated = now;
  await setDashboardState(state);

  const highlight = signals.find(
    (s) => s.classification === "Interview Request" || s.classification === "Rejection"
  );
  if (highlight) {
    await addActivity({
      at: now,
      type: "inbox_signal",
      title: highlight.summary,
      meta: `${highlight.classification} · ${highlight.sentiment}`,
    });
  }

  return { scanned: signals.length, signals };
}

import { NextResponse } from "next/server";
import { getDashboardState } from "@/lib/dashboard-store";
import { getInterviews, upsertInterview } from "@/lib/analytics-store";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Returns interview events that ended 2+ hours ago and don't have pm_score yet.
 * Ensures an Interview record exists for each such event.
 */
export async function GET() {
  try {
    const [state, interviews] = await Promise.all([
      getDashboardState(),
      getInterviews(),
    ]);
    const now = Date.now();
    const pending: { calendarEventId: string; eventTitle: string; eventEnd: string }[] = [];

    for (const w of state.prepModeWindows) {
      const eventEnd = new Date(w.prepEnd).getTime();
      if (now - eventEnd < TWO_HOURS_MS) continue;
      const existing = interviews.find((i) => i.calendarEventId === w.calendarEventId);
      if (existing?.pm_score != null) continue;

      await upsertInterview({
        id: existing?.id ?? `int_${w.calendarEventId}`,
        calendarEventId: w.calendarEventId,
        eventTitle: w.eventTitle,
        eventEnd: w.prepEnd,
      });
      pending.push({
        calendarEventId: w.calendarEventId,
        eventTitle: w.eventTitle,
        eventEnd: w.prepEnd,
      });
    }

    return NextResponse.json({ pending });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to get pending outcomes" },
      { status: 500 }
    );
  }
}

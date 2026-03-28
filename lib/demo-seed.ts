import { getDashboardState, setDashboardState } from "@/lib/dashboard-store";
import { mergeDemoAnalytics } from "@/lib/analytics-store";
import { seedDemoResumes } from "@/lib/profile-store";
import type { PrepModeWindow, InboxSignal } from "@/types/sentinel";

const PREP_MINUTES = 30;

function windowFromEvent(title: string, eventStart: Date, calendarEventId: string): PrepModeWindow {
  const prepStart = new Date(eventStart.getTime() - PREP_MINUTES * 60 * 1000);
  return {
    id: `demo_win_${calendarEventId}`,
    calendarEventId,
    eventTitle: title,
    eventStart: eventStart.toISOString(),
    prepStart: prepStart.toISOString(),
    prepEnd: eventStart.toISOString(),
  };
}

/**
 * Build sample interview prep windows anchored to `now` (titles include Sentinel calendar keywords).
 */
export function buildDemoPrepWindows(now: Date): PrepModeWindow[] {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const at = (dayOffset: number, h: number, m: number) => {
    const d = new Date(startOfDay);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const specs: { title: string; start: Date; ev: string }[] = [
    { title: "Northwind Labs — Phone screen", start: at(0, 14, 0), ev: "demo_evt_phone" },
    { title: "Stellar AI — Technical interview", start: at(0, 16, 30), ev: "demo_evt_technical" },
    { title: "Blue Harbor — Onsite interview", start: at(1, 10, 0), ev: "demo_evt_onsite" },
    { title: "Kite Systems — Meeting with hiring manager", start: at(3, 15, 0), ev: "demo_evt_hm" },
  ];

  return specs.map((s) => windowFromEvent(s.title, s.start, s.ev));
}

export async function replaceDemoPrepWindows(): Promise<void> {
  const state = await getDashboardState();
  const real = state.prepModeWindows.filter((w) => !w.calendarEventId.startsWith("demo_evt_"));
  const demos = buildDemoPrepWindows(new Date());
  state.prepModeWindows = [...real, ...demos].sort(
    (a, b) => new Date(a.prepStart).getTime() - new Date(b.prepStart).getTime()
  );
  state.lastUpdated = new Date().toISOString();
  await setDashboardState(state);
}

export function buildDemoInboxSignals(now: Date): InboxSignal[] {
  const t = now.toISOString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  return [
    {
      threadId: "demo_thread_invite",
      subject: "Northwind Labs — Interview availability",
      from: "recruiting@northwind.demo",
      snippet: "We would like to schedule a 45-minute technical interview. Please share slots.",
      classification: "Interview Request",
      sentiment: "positive",
      summary: "Recruiter asking for interview availability — positive momentum.",
      scannedAt: t,
      suggestedEventStart: tomorrow.toISOString(),
      suggestedEventTitle: "Northwind Labs — technical interview",
    },
    {
      threadId: "demo_thread_status",
      subject: "Application received — Stellar AI",
      from: "talent@stellar.demo",
      snippet: "Thanks for applying. Your profile is under review with the hiring manager.",
      classification: "Status Update",
      sentiment: "neutral",
      summary: "Application acknowledged; still in review.",
      scannedAt: t,
    },
    {
      threadId: "demo_thread_reject",
      subject: "Update on your application",
      from: "hiring@oakridge.demo",
      snippet: "We will not be moving forward at this time. We appreciate your interest.",
      classification: "Rejection",
      sentiment: "negative",
      summary: "Closed loop — role not moving forward.",
      scannedAt: t,
    },
    {
      threadId: "demo_thread_followup",
      subject: "Following up",
      from: "jane.smith@blueharbor.demo",
      snippet: "Just checking if you had a chance to review the take-home instructions.",
      classification: "Follow-up",
      sentiment: "mixed",
      summary: "Recruiter nudge on take-home — respond when ready.",
      scannedAt: t,
    },
  ];
}

/** Replace only demo_* inbox rows and add fresh demo signals (for POST …?demo=1). */
export async function seedDemoInboxOnly(): Promise<void> {
  const state = await getDashboardState();
  const kept = state.inboxSignals.filter((s) => !s.threadId.startsWith("demo_thread_"));
  const now = new Date();
  state.inboxSignals = [...buildDemoInboxSignals(now), ...kept].slice(0, 30);
  state.lastInboxScanAt = now.toISOString();
  state.lastUpdated = now.toISOString();
  await setDashboardState(state);
}

export function isDemoSeedAllowed(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_DEMO_SEED === "1"
  );
}

export async function runFullDemoSeed(): Promise<void> {
  await replaceDemoPrepWindows();
  await mergeDemoAnalytics();
  await seedDemoResumes();
  await seedDemoInboxOnly();
}

"use client";

import { useEffect, useState } from "react";
import type { DashboardState, PrepModeWindow, InboxSignal } from "@/types/sentinel";
import type { PerformanceMetrics } from "@/types/analytics";
import type { ActivityItem } from "@/types/analytics";
import Link from "next/link";
import { Calendar, BarChart3, Activity, Sparkles, Mail, RefreshCw, CalendarDays, ListTodo } from "lucide-react";
import { RingProgress } from "@/components/RingProgress";

const EMPTY_METRICS: PerformanceMetrics = {
  totalApplications: 0,
  responseRate: 0,
  ghostingRate: 0,
  interviewToOfferRate: 0,
  interviewSuccessRate: 0,
  marketAlignment: 0,
  responseRateTrend: "flat",
  interviewSuccessTrend: "flat",
  marketAlignmentTrend: "flat",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatActivityTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60 * 1000) return "Just now";
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function isInPrepWindow(window: PrepModeWindow): boolean {
  const now = Date.now();
  const start = new Date(window.prepStart).getTime();
  const end = new Date(window.prepEnd).getTime();
  return now >= start && now <= end;
}

function getTalkingPoints(eventTitle: string): string[] {
  const company = eventTitle.replace(/\s*(interview|phone screen|technical|onsite).*$/i, "").trim() || "this company";
  return [
    `Why you're interested in ${company} and the role`,
    "A concrete win that shows impact (metric or outcome)",
    "One thoughtful question about the team or product",
  ];
}

export function CommandCenter() {
  const [state, setState] = useState<DashboardState | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [edgeTips, setEdgeTips] = useState<string[]>([]);
  const [pendingOutcomes, setPendingOutcomes] = useState<{ calendarEventId: string; eventTitle: string; eventEnd: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingOutcome, setSubmittingOutcome] = useState<string | null>(null);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const [scanningInbox, setScanningInbox] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      try {
        const [stateRes, metricsRes, activityRes, edgeRes, pendingRes] = await Promise.all([
          fetch("/api/dashboard/state"),
          fetch("/api/analytics/metrics"),
          fetch("/api/analytics/activity"),
          fetch("/api/edge"),
          fetch("/api/analytics/pending-outcomes"),
        ]);
        if (cancelled) return;
        const [stateData, metricsData, activityData, edgeData, pendingData] = await Promise.all([
          stateRes.json(),
          metricsRes.json(),
          activityRes.json(),
          edgeRes.json(),
          pendingRes.json(),
        ]);
        if (stateData.prepModeWindows != null) setState(stateData);
        if (typeof metricsData.responseRate === "number") setMetrics(metricsData);
        else setMetrics(EMPTY_METRICS);
        if (activityData.items) setActivity(activityData.items);
        if (edgeData.tips) setEdgeTips(edgeData.tips);
        if (pendingData.pending) setPendingOutcomes(pendingData.pending);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    const interval = setInterval(fetchAll, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function recordOutcome(calendarEventId: string, pm_score: 1 | 2 | 3) {
    setSubmittingOutcome(calendarEventId);
    try {
      await fetch("/api/analytics/interview-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarEventId, pm_score }),
      });
      setPendingOutcomes((prev) => prev.filter((p) => p.calendarEventId !== calendarEventId));
      const [metricsRes, activityRes] = await Promise.all([
        fetch("/api/analytics/metrics"),
        fetch("/api/analytics/activity"),
      ]);
      const [metricsData, activityData] = await Promise.all([metricsRes.json(), activityRes.json()]);
      if (typeof metricsData.responseRate === "number") setMetrics(metricsData);
      if (activityData.items) setActivity(activityData.items);
    } finally {
      setSubmittingOutcome(null);
    }
  }

  async function loadDemoData() {
    setSeedingDemo(true);
    setSeedError(null);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Could not load demo data");
      }
      const [stateRes, metricsRes, activityRes, edgeRes, pendingRes] = await Promise.all([
        fetch("/api/dashboard/state"),
        fetch("/api/analytics/metrics"),
        fetch("/api/analytics/activity"),
        fetch("/api/edge"),
        fetch("/api/analytics/pending-outcomes"),
      ]);
      const [stateData, metricsData, activityData, edgeData, pendingData] = await Promise.all([
        stateRes.json(),
        metricsRes.json(),
        activityRes.json(),
        edgeRes.json(),
        pendingRes.json(),
      ]);
      if (stateData.prepModeWindows != null) setState(stateData);
      if (typeof metricsData.responseRate === "number") setMetrics(metricsData);
      else if (!metricsRes.ok) setMetrics(EMPTY_METRICS);
      if (activityData.items) setActivity(activityData.items);
      if (edgeData.tips) setEdgeTips(edgeData.tips);
      if (pendingData.pending) setPendingOutcomes(pendingData.pending);
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : "Demo seed failed");
    } finally {
      setSeedingDemo(false);
    }
  }

  async function refreshDashboardState() {
    const [stateRes, activityRes, pendingRes, metricsRes] = await Promise.all([
      fetch("/api/dashboard/state"),
      fetch("/api/analytics/activity"),
      fetch("/api/analytics/pending-outcomes"),
      fetch("/api/analytics/metrics"),
    ]);
    const [stateData, activityData, pendingData, metricsData] = await Promise.all([
      stateRes.json(),
      activityRes.json(),
      pendingRes.json(),
      metricsRes.json(),
    ]);
    if (stateData.prepModeWindows != null) setState(stateData);
    if (activityData.items) setActivity(activityData.items);
    if (pendingData.pending) setPendingOutcomes(pendingData.pending);
    if (typeof metricsData.responseRate === "number") setMetrics(metricsData);
    else setMetrics(EMPTY_METRICS);
  }

  async function runInboxScan(demo: boolean) {
    setScanningInbox(true);
    setScanError(null);
    try {
      const url = demo ? "/api/dashboard/scan-inbox?demo=1" : "/api/dashboard/scan-inbox";
      const res = await fetch(url, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data as { ok?: boolean }).ok === false) {
        throw new Error((data as { error?: string }).error ?? "Inbox scan failed");
      }
      await refreshDashboardState();
    } catch (e) {
      setScanError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanningInbox(false);
    }
  }

  function sentimentLabel(s: InboxSignal["sentiment"]): string {
    const map = {
      positive: "Positive",
      neutral: "Neutral",
      negative: "Negative",
      mixed: "Mixed",
    } as const;
    return map[s];
  }

  if (loading) {
    return (
      <main className="dashboard-wrap">
        <div className="bento-loading">Loading…</div>
      </main>
    );
  }
  if (!state) {
    return (
      <main className="dashboard-wrap">
        <div className="bento-loading">Failed to load dashboard.</div>
      </main>
    );
  }

  const displayMetrics = metrics ?? EMPTY_METRICS;
  const inboxSignals = state.inboxSignals ?? [];

  const activePrep = state.prepModeWindows.find(isInPrepWindow);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);
  const weekEnd = new Date(startOfToday);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const today = startOfToday.toDateString();
  const todayWindows = state.prepModeWindows.filter(
    (w) => new Date(w.eventStart).toDateString() === today
  );
  const upcomingWindows = state.prepModeWindows
    .filter((w) => {
      const t = new Date(w.eventStart).getTime();
      return t > endOfToday.getTime() && t <= weekEnd.getTime();
    })
    .sort((a, b) => new Date(a.eventStart).getTime() - new Date(b.eventStart).getTime());

  const inboxWithTime = inboxSignals.filter((s) => {
    if (!s.suggestedEventStart) return false;
    const t = new Date(s.suggestedEventStart).getTime();
    return !Number.isNaN(t) && t > Date.now() - 24 * 60 * 60 * 1000;
  });

  const stripEndMs = startOfToday.getTime() + 14 * 86400000;
  const windowsStrip = state.prepModeWindows.filter((w) => {
    const t = new Date(w.eventStart).getTime();
    return t >= startOfToday.getTime() && t < stripEndMs;
  });
  const inboxTimedStrip = inboxSignals.filter((s) => {
    if (!s.suggestedEventStart) return false;
    const t = new Date(s.suggestedEventStart).getTime();
    return !Number.isNaN(t) && t >= startOfToday.getTime() && t < stripEndMs;
  });
  const stripDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() + i);
    return d;
  });

  function hitsForDay(day: Date): { cal: string[]; gmail: string[] } {
    const key = day.toDateString();
    const cal: string[] = [];
    const gmail: string[] = [];
    for (const w of windowsStrip) {
      if (new Date(w.eventStart).toDateString() === key) cal.push(w.eventTitle);
    }
    for (const s of inboxTimedStrip) {
      if (!s.suggestedEventStart) continue;
      if (new Date(s.suggestedEventStart).toDateString() === key) {
        gmail.push(s.suggestedEventTitle ?? s.subject);
      }
    }
    return { cal, gmail };
  }

  const followUpSignals = inboxSignals
    .filter(
      (s) =>
        s.classification === "Interview Request" ||
        s.classification === "Follow-up" ||
        (s.classification === "Status Update" && s.sentiment !== "negative")
    )
    .slice(0, 8);

  return (
    <main className="dashboard-wrap">
      <header className="dashboard-page-header">
        <h1 className="dashboard-page-title">Command Center</h1>
        <p className="dashboard-page-lead">
          Smart Calendar merges <strong>Google Calendar</strong> interviews with <strong>Gmail</strong> scans.
          Run an inbox scan to detect interview requests, rejections, status updates, and sentiment.
        </p>
      </header>

      {pendingOutcomes.length > 0 && (
        <div className="outcome-banner">
          <strong>How did it go?</strong>
          <p className="outcome-sub">{pendingOutcomes[0].eventTitle}</p>
          <div className="outcome-buttons">
            <button
              type="button"
              className="outcome-btn stumbled"
              onClick={() => recordOutcome(pendingOutcomes[0].calendarEventId, 1)}
              disabled={!!submittingOutcome}
            >
              Stumbled
            </button>
            <button
              type="button"
              className="outcome-btn average"
              onClick={() => recordOutcome(pendingOutcomes[0].calendarEventId, 2)}
              disabled={!!submittingOutcome}
            >
              Average
            </button>
            <button
              type="button"
              className="outcome-btn nailed"
              onClick={() => recordOutcome(pendingOutcomes[0].calendarEventId, 3)}
              disabled={!!submittingOutcome}
            >
              Nailed it
            </button>
          </div>
        </div>
      )}

      {activePrep && (
        <div className="nudge-banner">
          <strong className="nudge-title">Prep Mode — {activePrep.eventTitle}</strong>
          <p className="nudge-sub">Top 3 talking points:</p>
          <ol className="nudge-points">
            {getTalkingPoints(activePrep.eventTitle).map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ol>
          <p className="nudge-until">Until {formatTime(activePrep.prepEnd)}</p>
        </div>
      )}

      <section className="analytics-section">
        <h2 className="analytics-title">Performance Analytics</h2>
        <div className="ring-row">
          <RingProgress
            value={displayMetrics.responseRate}
            label="Response Rate"
            trend={displayMetrics.responseRateTrend}
          />
          <RingProgress
            value={displayMetrics.interviewSuccessRate}
            label="Interview Success"
            trend={displayMetrics.interviewSuccessTrend}
          />
          <RingProgress
            value={displayMetrics.marketAlignment}
            label="Market Alignment"
            trend={displayMetrics.marketAlignmentTrend}
          />
        </div>
      </section>

      <div className="bento">
        <div className="bento-cell bento-overview bento-overview-wide">
          <div className="bento-header">
            <CalendarDays size={18} />
            <h2>At a glance</h2>
          </div>
          <div className="overview-split">
            <div className="cal-widget">
              <p className="cal-widget-title">Next 14 days</p>
              <div className="cal-strip" role="list">
                {stripDays.map((day) => {
                  const { cal, gmail } = hitsForDay(day);
                  const has = cal.length > 0 || gmail.length > 0;
                  const isToday = day.toDateString() === today;
                  const title = [
                    ...cal.map((c) => `Calendar: ${c}`),
                    ...gmail.map((g) => `Gmail: ${g}`),
                  ].join("\n");
                  return (
                    <div
                      key={day.toISOString()}
                      className={`cal-strip-day ${isToday ? "cal-strip-day--today" : ""} ${has ? "cal-strip-day--has" : ""}`}
                      role="listitem"
                      title={title || undefined}
                    >
                      <span className="cal-strip-dow">
                        {day.toLocaleDateString(undefined, { weekday: "narrow" })}
                      </span>
                      <span className="cal-strip-num">{day.getDate()}</span>
                      {has && (
                        <span className="cal-strip-dots" aria-hidden>
                          {cal.length > 0 && <span className="cal-dot cal-dot-cal" />}
                          {gmail.length > 0 && <span className="cal-dot cal-dot-gmail" />}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="cal-widget-legend">
                <span className="cal-dot cal-dot-cal" /> Calendar &nbsp;
                <span className="cal-dot cal-dot-gmail" /> Gmail-inferred
              </p>
            </div>
            <div className="followup-widget">
              <div className="followup-widget-head">
                <ListTodo size={16} aria-hidden />
                <p className="cal-widget-title">Follow-ups</p>
              </div>
              {followUpSignals.length === 0 ? (
                <p className="bento-muted followup-empty">
                  No inbox signals yet. <strong>Scan inbox</strong> below to surface interview replies,
                  nudges, and status threads—or open{" "}
                  <Link href="/match-lab/job-tracker" className="followup-link">
                    Job Tracker
                  </Link>{" "}
                  for outreach.
                </p>
              ) : (
                <ul className="followup-list">
                  {followUpSignals.map((s) => (
                    <li
                      key={s.threadId}
                      className={`followup-item followup-${s.classification.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <span className="followup-badge">
                        {s.classification === "Interview Request"
                          ? "Action"
                          : s.classification === "Follow-up"
                            ? "Reply"
                            : "Update"}
                      </span>
                      <div className="followup-body">
                        <span className="followup-subject">{s.subject || "(No subject)"}</span>
                        <span className="followup-summary">{s.summary}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="bento-cell bento-calendar bento-calendar-wide">
          <div className="bento-header">
            <Calendar size={18} />
            <h2>Smart Calendar</h2>
          </div>
          <div className="bento-body">
            <div className="inbox-scan-toolbar">
              <div className="inbox-scan-buttons">
                {state.inboxScanAvailable ? (
                  <button
                    type="button"
                    className="btn-inbox-scan"
                    onClick={() => runInboxScan(false)}
                    disabled={scanningInbox}
                  >
                    <RefreshCw size={16} className={scanningInbox ? "animate-spin" : ""} aria-hidden />
                    {scanningInbox ? "Scanning Gmail…" : "Scan inbox now"}
                  </button>
                ) : (
                  <p className="inbox-scan-unavailable">
                    <Mail size={16} aria-hidden />
                    Connect Google (<code className="code-inline">GOOGLE_*</code> +{" "}
                    <code className="code-inline">OPENAI_API_KEY</code> for best accuracy) to scan invites
                    and rejections.
                  </p>
                )}
                {state.demoSeedAllowed && (
                  <button
                    type="button"
                    className="btn-inbox-scan secondary"
                    onClick={() => runInboxScan(true)}
                    disabled={scanningInbox}
                  >
                    Demo inbox scan
                  </button>
                )}
              </div>
              {state.lastInboxScanAt && (
                <p className="inbox-scan-meta">
                  Last inbox sync: {formatTime(state.lastInboxScanAt)}
                </p>
              )}
              {scanError && (
                <p className="demo-seed-error" role="alert">
                  {scanError}
                </p>
              )}
            </div>

            <p className="bento-label">Google Calendar — today</p>
            {todayWindows.length === 0 ? (
              <p className="bento-muted">No interviews today.</p>
            ) : (
              <ul className="bento-list">
                {todayWindows.map((w) => (
                  <li key={w.id} className={isInPrepWindow(w) ? "active" : ""}>
                    <span className="event-title">{w.eventTitle}</span>
                    <span className="event-time">{formatTime(w.prepStart)} → {formatTime(w.prepEnd)}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="bento-label calendar-upcoming-label">Google Calendar — next 7 days</p>
            {upcomingWindows.length === 0 ? (
              <p className="bento-muted">No upcoming interviews this week.</p>
            ) : (
              <ul className="bento-list bento-list-compact">
                {upcomingWindows.map((w) => (
                  <li key={w.id}>
                    <span className="event-title">{w.eventTitle}</span>
                    <span className="event-time">{formatTime(w.eventStart)}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="bento-label calendar-upcoming-label">From Gmail — inferred times</p>
            {inboxWithTime.length === 0 ? (
              <p className="bento-muted">
                No upcoming times parsed from email yet. Scan inbox; interview mails sometimes
                include a proposed slot (shown here when detected).
              </p>
            ) : (
              <ul className="bento-list bento-list-compact">
                {inboxWithTime.map((s) => (
                  <li key={s.threadId}>
                    <span className="event-title">
                      {s.suggestedEventTitle ?? s.subject}
                      <span className={`classification-tag tag-${s.classification.replace(/\s+/g, "-").toLowerCase()}`}>
                        {s.classification}
                      </span>
                    </span>
                    <span className="event-time">
                      {s.suggestedEventStart && formatTime(s.suggestedEventStart)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="bento-label calendar-upcoming-label">Inbox intelligence</p>
            {inboxSignals.length === 0 ? (
              <p className="bento-muted">
                No signals yet. Scan pulls recent threads and labels each with type + sentiment.
              </p>
            ) : (
              <ul className="inbox-signal-list">
                {inboxSignals.map((s) => (
                  <li key={s.threadId} className="inbox-signal-item">
                    <div className="inbox-signal-top">
                      <span className={`sentiment-dot sentiment-${s.sentiment}`} title={sentimentLabel(s.sentiment)} />
                      <span className="inbox-signal-subject">{s.subject || "(No subject)"}</span>
                    </div>
                    <div className="inbox-signal-meta">
                      <span className={`classification-chip chip-${s.classification.replace(/\s+/g, "-").toLowerCase()}`}>
                        {s.classification}
                      </span>
                      <span className={`sentiment-pill sentiment-${s.sentiment}`}>{sentimentLabel(s.sentiment)}</span>
                    </div>
                    <p className="inbox-signal-summary">{s.summary}</p>
                    <p className="inbox-signal-from">{s.from}</p>
                  </li>
                ))}
              </ul>
            )}

            {state.demoSeedAllowed ? (
              <div className="demo-seed-block">
                <button
                  type="button"
                  className="btn-demo-seed"
                  onClick={loadDemoData}
                  disabled={seedingDemo}
                >
                  {seedingDemo ? "Loading sample data…" : "Load sample interviews & resumes"}
                </button>
                <p className="demo-seed-hint">
                  Fills Smart Calendar, Quick Stats, Activity, and Profile with demo data (this machine /
                  preview deploy with{" "}
                  <code className="code-inline">ALLOW_DEMO_SEED=1</code>).
                </p>
                {seedError ? <p className="demo-seed-error">{seedError}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="bento-cell bento-stats">
          <div className="bento-header">
            <BarChart3 size={18} />
            <h2>Quick Stats</h2>
          </div>
          <div className="bento-body">
            <div className="stat-row">
              <span className="bento-muted">Total apps</span>
              <span className="stat-value">{displayMetrics.totalApplications}</span>
            </div>
            <div className="stat-row">
              <span className="bento-muted">Active interviews</span>
              <span className="stat-value">{state.prepModeWindows.length}</span>
            </div>
          </div>
        </div>

        <div className="bento-cell bento-activity">
          <div className="bento-header">
            <Activity size={18} />
            <h2>Activity History</h2>
          </div>
          <div className="bento-body activity-feed">
            {activity.length === 0 ? (
              <p className="bento-muted">No recent activity.</p>
            ) : (
              <ul className="activity-list">
                {activity.map((a) => (
                  <li key={a.id}>
                    <span className="activity-title">{a.title}</span>
                    {a.meta && <span className="activity-meta">{a.meta}</span>}
                    <span className="activity-time">{formatActivityTime(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bento-cell bento-edge">
          <div className="bento-header">
            <Sparkles size={18} />
            <h2>The Edge</h2>
          </div>
          <div className="bento-body edge-feed">
            <div className="edge-scroll">
              {edgeTips.map((tip, i) => (
                <p key={i} className="edge-tip">{tip}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

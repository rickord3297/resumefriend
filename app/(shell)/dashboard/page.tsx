"use client";

import { useEffect, useState } from "react";
import type { DashboardState, PrepModeWindow } from "@/types/sentinel";
import type { PerformanceMetrics } from "@/types/analytics";
import type { ActivityItem } from "@/types/analytics";
import { Calendar, BarChart3, Activity, Sparkles } from "lucide-react";
import { RingProgress } from "@/components/RingProgress";

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

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [edgeTips, setEdgeTips] = useState<string[]>([]);
  const [pendingOutcomes, setPendingOutcomes] = useState<{ calendarEventId: string; eventTitle: string; eventEnd: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingOutcome, setSubmittingOutcome] = useState<string | null>(null);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

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
        if (metricsData.responseRate != null) setMetrics(metricsData);
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
      if (metricsData.responseRate != null) setMetrics(metricsData);
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
      if (metricsData.responseRate != null) setMetrics(metricsData);
      if (activityData.items) setActivity(activityData.items);
      if (edgeData.tips) setEdgeTips(edgeData.tips);
      if (pendingData.pending) setPendingOutcomes(pendingData.pending);
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : "Demo seed failed");
    } finally {
      setSeedingDemo(false);
    }
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

  return (
    <main className="dashboard-wrap">
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

      {metrics && (
        <section className="analytics-section">
          <h2 className="analytics-title">Performance Analytics</h2>
          <div className="ring-row">
            <RingProgress
              value={metrics.responseRate}
              label="Response Rate"
              trend={metrics.responseRateTrend}
            />
            <RingProgress
              value={metrics.interviewSuccessRate}
              label="Interview Success"
              trend={metrics.interviewSuccessTrend}
            />
            <RingProgress
              value={metrics.marketAlignment}
              label="Market Alignment"
              trend={metrics.marketAlignmentTrend}
            />
          </div>
        </section>
      )}

      <div className="bento">
        <div className="bento-cell bento-calendar">
          <div className="bento-header">
            <Calendar size={18} />
            <h2>Smart Calendar</h2>
          </div>
          <div className="bento-body">
            <p className="bento-label">Today&apos;s interviews</p>
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
            <p className="bento-label calendar-upcoming-label">Next 7 days</p>
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
              <span className="stat-value">{metrics?.totalApplications ?? "—"}</span>
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

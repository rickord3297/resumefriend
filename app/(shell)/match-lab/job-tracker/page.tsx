import { Suspense } from "react";
import JobTrackerClient from "./job-tracker-client";

function JobTrackerFallback() {
  return (
    <main className="page-main">
      <h1 className="page-title">Job Tracker</h1>
      <p className="page-desc muted">Loading…</p>
    </main>
  );
}

export default function JobTrackerPage() {
  return (
    <Suspense fallback={<JobTrackerFallback />}>
      <JobTrackerClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import CareerCoachClient from "./career-coach-client";

function CareerCoachFallback() {
  return (
    <main className="page-main">
      <h1 className="page-title">AI Assistant</h1>
      <p className="page-desc muted">Loading…</p>
    </main>
  );
}

export default function CareerCoachPage() {
  return (
    <Suspense fallback={<CareerCoachFallback />}>
      <CareerCoachClient />
    </Suspense>
  );
}

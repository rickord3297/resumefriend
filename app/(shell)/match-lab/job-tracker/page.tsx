"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { CompanyResearchResult, OutreachSequence } from "@/types/job-hunter";
import { PERSONA_LABELS } from "@/types/persona";

export default function JobTrackerPage() {
  const searchParams = useSearchParams();
  const autoApply = searchParams.get("autoApply") === "1";
  const [companyName, setCompanyName] = useState("");
  const [research, setResearch] = useState<CompanyResearchResult | null>(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [personaBullets, setPersonaBullets] = useState<string[]>([]);
  const [personaLabel, setPersonaLabel] = useState<string>("Generalist / Alternative");
  const [sequence, setSequence] = useState<OutreachSequence | null>(null);
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResearch() {
    if (!companyName.trim()) return;
    setResearchLoading(true);
    setError(null);
    setResearch(null);
    try {
      const res = await fetch("/api/job-hunter/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Research failed");
      setResearch(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setResearchLoading(false);
    }
  }

  async function handleDraftSequence() {
    if (!companyName.trim()) return;
    if (personaBullets.length === 0) {
      setError("Add persona bullets or paste 2–3 bullets below.");
      return;
    }
    setSequenceLoading(true);
    setError(null);
    setSequence(null);
    try {
      const res = await fetch("/api/job-hunter/sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          contactName: research?.hiringManagers?.[0]?.name,
          contactTitle: research?.hiringManagers?.[0]?.title,
          personaBullets,
          personaLabel,
          research,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sequence failed");
      setSequence(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSequenceLoading(false);
    }
  }

  const bulletsText = personaBullets.join("\n");
  const setBulletsFromText = (text: string) =>
    setPersonaBullets(text.split("\n").map((s) => s.trim()).filter(Boolean));

  return (
    <main className="page-main">
      <h1 className="page-title">Job Tracker</h1>
      <p className="page-desc">
        Research hiring managers and draft 3-step outreach with your persona bullets.
      </p>

      {autoApply && (
        <div className="context-banner">
          <strong>Auto-Apply mode</strong>
          <p>Use your Primary Resume from Profile &amp; Assets. We&apos;ll pre-fill application fields and generate a 3-sentence &quot;Why Me?&quot; for the cover letter based on the job description.</p>
        </div>
      )}

      <section className="form-section">
        <h2 className="form-section-title">1. Research company</h2>
        <div className="form-row">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name"
            className="input"
          />
          <button
            type="button"
            onClick={handleResearch}
            disabled={researchLoading || !companyName.trim()}
            className="btn-primary"
          >
            {researchLoading ? "Searching…" : "Find hiring managers"}
          </button>
        </div>
      </section>

      {research && (
        <section className="card-section">
          <h3 className="card-section-title">Contacts at {research.companyName}</h3>
          <ul className="contact-list">
            {research.hiringManagers.map((h, i) => (
              <li key={i}>
                <strong>{h.name}</strong>
                {h.title && ` · ${h.title}`}
                {h.email && <span className="muted"> · {h.email}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="form-section">
        <h2 className="form-section-title">2. Persona bullets</h2>
        <textarea
          value={bulletsText}
          onChange={(e) => setBulletsFromText(e.target.value)}
          placeholder="Paste 2–5 highlight bullets (one per line)"
          rows={4}
          className="textarea"
        />
        <p className="form-hint">
          Persona:{" "}
          <select
            value={personaLabel}
            onChange={(e) => setPersonaLabel(e.target.value)}
            className="select"
          >
            {Object.entries(PERSONA_LABELS).map(([k, v]) => (
              <option key={k} value={v}>{v}</option>
            ))}
          </select>
        </p>
      </section>

      <section className="form-section">
        <h2 className="form-section-title">3. Draft sequence</h2>
        <button
          type="button"
          onClick={handleDraftSequence}
          disabled={sequenceLoading || personaBullets.length === 0}
          className="btn-primary"
        >
          {sequenceLoading ? "Drafting…" : "Draft 3-step sequence"}
        </button>
      </section>

      {error && <p className="error-msg">{error}</p>}

      {sequence && (
        <div className="card-section">
          <h3 className="card-section-title">Outreach for {sequence.companyName}</h3>
          {sequence.steps.map((step, i) => (
            <div key={i} className="sequence-step">
              <strong className="step-kind">{step.kind.replace("_", " ")}</strong>
              {step.delayDays != null && step.delayDays > 0 && (
                <span className="muted"> (after {step.delayDays} days)</span>
              )}
              <p className="step-subject">Subject: {step.subject}</p>
              <pre className="step-body">{step.body}</pre>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

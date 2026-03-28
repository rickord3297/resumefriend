"use client";

import { useState } from "react";
import Link from "next/link";
import type { CompanyResearchResult, OutreachSequence } from "@/types/job-hunter";
import { PERSONA_LABELS } from "@/types/persona";

export default function JobHunterPage() {
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

  async function handleDraftSequence(contactName?: string, contactTitle?: string) {
    if (!companyName.trim()) return;
    if (personaBullets.length === 0) {
      setError("Add persona bullets (from PersonaEngine) or paste 2–3 bullets below.");
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
          contactName: contactName ?? research?.hiringManagers?.[0]?.name,
          contactTitle: contactTitle ?? research?.hiringManagers?.[0]?.title,
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
    <main style={{ padding: "2rem", maxWidth: "56rem", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>JobHunter</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Research hiring managers, then draft a 3-step outreach sequence with your persona bullets injected.
      </p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>1. Research company</h2>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name"
          style={{
            width: "100%",
            maxWidth: 320,
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid var(--surface)",
            background: "var(--surface)",
            color: "var(--text)",
            marginRight: 8,
          }}
        />
        <button
          type="button"
          onClick={handleResearch}
          disabled={researchLoading || !companyName.trim()}
          style={{
            padding: "10px 16px",
            borderRadius: 6,
            border: "none",
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 600,
            cursor: researchLoading ? "wait" : "pointer",
          }}
        >
          {researchLoading ? "Searching…" : "Find hiring managers"}
        </button>
      </section>

      {research && (
        <section style={{ marginBottom: 24, padding: 16, background: "var(--surface)", borderRadius: 8 }}>
          <h3 style={{ marginBottom: 8 }}>Contacts at {research.companyName}</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {research.hiringManagers.map((h, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <strong>{h.name}</strong>
                {h.title && ` · ${h.title}`}
                {h.email && <span style={{ color: "var(--muted)", fontSize: 14 }}> · {h.email}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>2. Persona bullets (from PersonaEngine)</h2>
        <textarea
          value={bulletsText}
          onChange={(e) => setBulletsFromText(e.target.value)}
          placeholder="Paste 2–5 highlight bullets from PersonaEngine (one per line)"
          rows={4}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 6,
            border: "1px solid var(--surface)",
            background: "var(--surface)",
            color: "var(--text)",
            fontFamily: "inherit",
          }}
        />
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
          Persona label (for tailoring):{" "}
          <select
            value={personaLabel}
            onChange={(e) => setPersonaLabel(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid var(--surface)",
              background: "var(--surface)",
              color: "var(--text)",
            }}
          >
            {Object.entries(PERSONA_LABELS).map(([k, v]) => (
              <option key={k} value={v}>{v}</option>
            ))}
          </select>
        </p>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>3. Draft sequence</h2>
        <button
          type="button"
          onClick={() => handleDraftSequence()}
          disabled={sequenceLoading || personaBullets.length === 0}
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            border: "none",
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 600,
            cursor: sequenceLoading ? "wait" : "pointer",
          }}
        >
          {sequenceLoading ? "Drafting…" : "Draft 3-step sequence"}
        </button>
      </section>

      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}

      {sequence && (
        <div style={{ padding: 16, background: "var(--surface)", borderRadius: 8 }}>
          <h3 style={{ marginBottom: 12 }}>Outreach sequence for {sequence.companyName}</h3>
          {sequence.steps.map((step, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <strong style={{ textTransform: "capitalize" }}>{step.kind.replace("_", " ")}</strong>
              {step.delayDays != null && step.delayDays > 0 && (
                <span style={{ color: "var(--muted)", fontSize: 13 }}> (after {step.delayDays} days)</span>
              )}
              <p style={{ margin: "4px 0", fontSize: 13, color: "var(--muted)" }}>Subject: {step.subject}</p>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, margin: 0 }}>{step.body}</pre>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/tools" style={{ color: "var(--accent)", textDecoration: "none" }}>← Tools</Link>
      </p>
    </main>
  );
}

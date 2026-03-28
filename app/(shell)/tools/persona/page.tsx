"use client";

import { useState } from "react";
import Link from "next/link";
import type { PersonaEngineOutput, TailoredResume, PersonaKind } from "@/types/persona";

export default function PersonaEnginePage() {
  const [sourceText, setSourceText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PersonaEngineOutput | null>(null);

  async function handleGenerate() {
    if (!sourceText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/persona/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: sourceText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "56rem", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>PersonaEngine</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Paste your base resume or LinkedIn export. Get three tailored versions: SaaS/Startup (speed, building), Enterprise (scale, process), Generalist (adaptable).
      </p>
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "var(--muted)" }}>
          Resume or LinkedIn export
        </label>
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Paste full resume or LinkedIn About + Experience..."
          rows={12}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid var(--surface)",
            background: "var(--surface)",
            color: "var(--text)",
            fontFamily: "inherit",
          }}
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !sourceText.trim()}
          style={{
            marginTop: 12,
            padding: "10px 20px",
            borderRadius: 6,
            border: "none",
            background: "var(--accent)",
            color: "var(--bg)",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Generating…" : "Generate 3 personas"}
        </button>
      </div>
      {error && <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Base summary</h2>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>{result.baseSummary}</p>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Tailored versions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {result.versions.map((v) => (
              <ResumeVersionCard key={v.persona} version={v} />
            ))}
          </div>
        </div>
      )}
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/tools" style={{ color: "var(--accent)", textDecoration: "none" }}>← Tools</Link>
      </p>
    </main>
  );
}

function ResumeVersionCard({ version }: { version: TailoredResume }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        background: "var(--surface)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <h3 style={{ marginBottom: 8 }}>{version.label}</h3>
      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>{version.summary}</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", marginBottom: 8 }}>Highlight bullets (for outreach)</p>
      <ul style={{ margin: "0 0 12px", paddingLeft: 20 }}>
        {version.highlightBullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 4 }}>{b}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid var(--muted)",
          background: "transparent",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        {expanded ? "Hide sections" : "Show full sections"}
      </button>
      {expanded && version.sections.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {version.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: 13 }}>{s.title}</strong>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, margin: "4px 0 0", color: "var(--muted)" }}>{s.content}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

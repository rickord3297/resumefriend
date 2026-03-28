"use client";

import { useState } from "react";
import Link from "next/link";
import { VoiceLab } from "@/components/VoiceLab";
import { PERSONA_LABELS } from "@/types/persona";

export default function VoiceLabPage() {
  const [personaLabel, setPersonaLabel] = useState<string>("Generalist / Alternative");
  const [personaSummaryOrBullets, setPersonaSummaryOrBullets] = useState("");

  return (
    <main style={{ padding: "2rem", maxWidth: "56rem", margin: "0 auto" }}>
      <h1 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>VoiceLab</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Record your answer to common interview questions. Get instant feedback on content, confidence (filler words, tone), and alignment with your resume persona.
      </p>

      <div style={{ marginBottom: 16, padding: 12, background: "var(--surface)", borderRadius: 8 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "var(--muted)" }}>
          Resume persona (for alignment score)
        </label>
        <select
          value={personaLabel}
          onChange={(e) => setPersonaLabel(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "var(--bg)",
            color: "var(--text)",
            marginRight: 12,
          }}
        >
          {Object.entries(PERSONA_LABELS).map(([k, v]) => (
            <option key={k} value={v}>{v}</option>
          ))}
        </select>
        <div style={{ marginTop: 8 }}>
          <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "var(--muted)" }}>
            Optional: persona summary or key bullets (improves alignment feedback)
          </label>
          <textarea
            value={personaSummaryOrBullets}
            onChange={(e) => setPersonaSummaryOrBullets(e.target.value)}
            placeholder="Paste 2–3 bullets or a short summary from PersonaEngine"
            rows={2}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "var(--bg)",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          />
        </div>
      </div>

      <VoiceLab
        personaLabel={personaLabel}
        personaSummaryOrBullets={personaSummaryOrBullets}
      />

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/tools" style={{ color: "var(--accent)", textDecoration: "none" }}>← Tools</Link>
      </p>
    </main>
  );
}

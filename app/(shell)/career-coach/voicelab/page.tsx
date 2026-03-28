"use client";

import { useState } from "react";
import { VoiceLab } from "@/components/VoiceLab";
import { PERSONA_LABELS } from "@/types/persona";

export default function VoiceLabPage() {
  const [personaLabel, setPersonaLabel] = useState<string>("Generalist / Alternative");
  const [personaSummaryOrBullets, setPersonaSummaryOrBullets] = useState("");

  return (
    <main className="page-main">
      <h1 className="page-title">VoiceLab</h1>
      <p className="page-desc">
        Record answers to interview questions. Get feedback on content, confidence, and alignment with your persona.
      </p>

      <div className="voicelab-options">
        <label className="form-label">Resume persona (for alignment score)</label>
        <select
          value={personaLabel}
          onChange={(e) => setPersonaLabel(e.target.value)}
          className="select"
        >
          {Object.entries(PERSONA_LABELS).map(([k, v]) => (
            <option key={k} value={v}>{v}</option>
          ))}
        </select>
        <div className="form-label-wrap">
          <label className="form-label">Optional: persona summary or bullets</label>
          <textarea
            value={personaSummaryOrBullets}
            onChange={(e) => setPersonaSummaryOrBullets(e.target.value)}
            placeholder="Paste 2–3 bullets or a short summary"
            rows={2}
            className="textarea small"
          />
        </div>
      </div>

      <VoiceLab
        personaLabel={personaLabel}
        personaSummaryOrBullets={personaSummaryOrBullets}
      />
    </main>
  );
}

/**
 * PersonaEngine: tailored resume versions for different markets.
 */

export type PersonaKind = "saas_startup" | "enterprise" | "generalist";

export const PERSONA_LABELS: Record<PersonaKind, string> = {
  saas_startup: "SaaS / Startup",
  enterprise: "Enterprise",
  generalist: "Generalist / Alternative",
};

export interface ResumeSection {
  title: string;
  content: string; // plain text or markdown bullets
}

export interface TailoredResume {
  persona: PersonaKind;
  label: string;
  summary: string;
  sections: ResumeSection[];
  /** Re-contextualized achievement bullets (e.g. for injection into outreach) */
  highlightBullets: string[];
  raw?: string; // full text if needed
}

export interface PersonaEngineInput {
  /** Raw text from base resume or LinkedIn export */
  sourceText: string;
  /** Optional: structured JSON from a parser */
  sections?: { title: string; content: string }[];
}

export interface PersonaEngineOutput {
  baseSummary: string;
  versions: TailoredResume[];
  generatedAt: string; // ISO
}

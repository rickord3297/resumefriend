/**
 * JobHunter: outbound automation (research, sequencing, tailoring).
 */

export interface HiringManagerContact {
  name: string;
  title?: string;
  email?: string;
  linkedInUrl?: string;
  source?: string;
}

export interface CompanyResearchResult {
  companyName: string;
  hiringManagers: HiringManagerContact[];
  suggestedRoles?: string[]; // e.g. "Engineering Manager", "VP Engineering"
  researchedAt: string; // ISO
}

export type SequenceStepKind = "initial" | "follow_up_1" | "follow_up_2";

export interface SequenceStep {
  kind: SequenceStepKind;
  subject: string;
  body: string;
  /** Optional delay in days after previous step */
  delayDays?: number;
}

export interface OutreachSequence {
  companyName: string;
  contactName?: string;
  contactTitle?: string;
  steps: SequenceStep[];
  /** Persona bullets injected into the messages */
  injectedBullets: string[];
  generatedAt: string; // ISO
}

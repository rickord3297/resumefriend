/**
 * JobHunter: outbound automation.
 * - Research: find potential hiring managers by company (Apollo or LLM fallback).
 * - Sequencing: 3-step outreach (Initial, Follow-up 1, Follow-up 2).
 * - Tailoring: inject selected Persona highlight bullets into messages.
 */

export { researchCompany } from "./research";
export { draftOutreachSequence } from "./sequencing";
export type { CompanyResearchResult, HiringManagerContact, OutreachSequence, SequenceStep } from "@/types/job-hunter";

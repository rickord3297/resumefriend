/**
 * JobHunter Sequencing: draft 3-step outreach (Initial, Follow-up 1, Follow-up 2)
 * with automatic injection of persona highlight bullets for relevance.
 */

import OpenAI from "openai";
import type {
  OutreachSequence,
  SequenceStep,
  SequenceStepKind,
  CompanyResearchResult,
} from "@/types/job-hunter";
import type { PersonaKind } from "@/types/persona";

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  return key ? new OpenAI({ apiKey: key }) : null;
}

/**
 * Generate a 3-step outreach sequence tailored to the company and persona.
 * Injects specific bullets from the selected persona into the messages.
 */
export async function draftOutreachSequence(args: {
  companyName: string;
  research?: CompanyResearchResult;
  contactName?: string;
  contactTitle?: string;
  personaBullets: string[];
  personaLabel: string;
  roleOrTitle?: string; // e.g. "Senior Engineer"
}): Promise<OutreachSequence> {
  const openai = getOpenAI();
  if (!openai) throw new Error("OPENAI_API_KEY required for sequencing");

  const contact = args.contactName ?? "Hiring Manager";
  const title = args.contactTitle ?? args.research?.hiringManagers?.[0]?.title ?? "Hiring Manager";
  const bullets = args.personaBullets.slice(0, 3); // use top 3 for injection

  const systemPrompt = `You are an expert outbound recruiter. Draft a 3-step email sequence: Initial, Follow-up 1, Follow-up 2. Rules:
- Professional, concise, no spammy language.
- Weave in the provided "persona bullets" naturally (1-2 per email) so each message feels relevant to the candidate's profile.
- Each step should have a clear subject and body.
- Follow-up 1: gentle nudge, add one more value point. Delay 3-4 days.
- Follow-up 2: last touch, optional soft CTA. Delay 4-5 days after follow-up 1.
Output valid JSON only.`;

  const userPrompt = `Company: ${args.companyName}
Contact: ${contact} (${title})
Role of interest: ${args.roleOrTitle ?? "relevant role"}
Persona: ${args.personaLabel}

Persona bullets to inject where relevant (use these to tailor the message):
${bullets.map((b) => `- ${b}`).join("\n")}

Output JSON:
{
  "steps": [
    { "kind": "initial", "subject": "...", "body": "...", "delayDays": 0 },
    { "kind": "follow_up_1", "subject": "...", "body": "...", "delayDays": 3 },
    { "kind": "follow_up_2", "subject": "...", "body": "...", "delayDays": 4 }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1500,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const data = JSON.parse(raw);
  const steps: SequenceStep[] = (data.steps ?? []).map(
    (s: { kind?: string; subject?: string; body?: string; delayDays?: number }) => ({
      kind: (s.kind ?? "initial") as SequenceStepKind,
      subject: s.subject ?? "",
      body: s.body ?? "",
      delayDays: s.delayDays,
    })
  );

  return {
    companyName: args.companyName,
    contactName: contact,
    contactTitle: title,
    steps,
    injectedBullets: bullets,
    generatedAt: new Date().toISOString(),
  };
}

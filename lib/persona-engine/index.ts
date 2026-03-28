/**
 * PersonaEngine: pivot a candidate's history for different markets.
 * Input: base resume or LinkedIn export.
 * Output: three tailored versions (SaaS/Startup, Enterprise, Generalist) with re-contextualized achievements.
 */

import OpenAI from "openai";
import {
  type PersonaEngineInput,
  type PersonaEngineOutput,
  type TailoredResume,
  type PersonaKind,
  PERSONA_LABELS,
} from "@/types/persona";

const PERSONA_KINDS: PersonaKind[] = ["saas_startup", "enterprise", "generalist"];

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  return key ? new OpenAI({ apiKey: key }) : null;
}

const PERSONA_BRIEFS: Record<PersonaKind, string> = {
  saas_startup:
    "Emphasize speed, iteration, building from scratch, ownership, and scrappy execution. Use language like 'shipped', 'built', 'launched', '0-to-1', 'fast-paced'. Highlight impact with limited resources.",
  enterprise:
    "Emphasize scale, process, governance, cross-functional alignment, and measurable business outcomes. Use language like 'drove', 'scaled', 'implemented', 'stakeholder', 'metrics', 'compliance'. Highlight reliability and systems.",
  generalist:
    "Balance breadth and adaptability. Emphasize transferable skills, learning agility, and versatility. Frame achievements to appeal to multiple industries or roles. Avoid over-specialized jargon.",
};

/**
 * Generate three tailored resume versions from base input.
 * Re-contextualizes achievements per persona, not just keyword swap.
 */
export async function generatePersonas(input: PersonaEngineInput): Promise<PersonaEngineOutput> {
  const openai = getOpenAI();
  if (!openai) throw new Error("OPENAI_API_KEY required for PersonaEngine");

  const source = input.sections
    ? input.sections.map((s) => `## ${s.title}\n${s.content}`).join("\n\n")
    : input.sourceText;

  const systemPrompt = `You are an expert resume writer. Your task is to re-contextualize a candidate's experience for different job markets. Do NOT simply swap keywords. Rewrite and reframe achievements so they resonate with each audience:

- SaaS/Startup: speed, building, ownership, 0-to-1, scrappy, shipped, launched.
- Enterprise: scale, process, governance, stakeholder alignment, metrics, compliance, drove, implemented.
- Generalist: transferable skills, adaptability, breadth; avoid niche jargon.

Output valid JSON only, no markdown code fence.`;

  const userPrompt = `Base resume or LinkedIn export:

---
${source.slice(0, 12000)}
---

For each of the three personas (saas_startup, enterprise, generalist), produce:
1. A 2-3 sentence professional summary tailored to that market.
2. The same experience sections but with achievements re-contextualized (rewrite bullet points, same facts, different framing).
3. Exactly 5 "highlight bullets" — the strongest re-contextualized one-liners to use in outreach.

Respond with a single JSON object of this shape (use the exact keys):
{
  "baseSummary": "one sentence describing the candidate from the source",
  "versions": [
    {
      "persona": "saas_startup",
      "label": "SaaS / Startup",
      "summary": "...",
      "sections": [ { "title": "Experience", "content": "bullet1\\nbullet2\\n..." }, ... ],
      "highlightBullets": [ "bullet1", "bullet2", "bullet3", "bullet4", "bullet5" ]
    },
    { "persona": "enterprise", ... },
    { "persona": "generalist", ... }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4096,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: {
    baseSummary?: string;
    versions?: Array<{
      persona: string;
      label: string;
      summary: string;
      sections: { title: string; content: string }[];
      highlightBullets: string[];
    }>;
  };

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("PersonaEngine: invalid JSON from model");
  }

  const versions: TailoredResume[] = (parsed.versions ?? []).map((v) => ({
    persona: (v.persona as PersonaKind) || "generalist",
    label: v.label ?? PERSONA_LABELS[(v.persona as PersonaKind) ?? "generalist"],
    summary: v.summary ?? "",
    sections: v.sections ?? [],
    highlightBullets: Array.isArray(v.highlightBullets) ? v.highlightBullets.slice(0, 5) : [],
  }));

  // Ensure we have all three
  for (const kind of PERSONA_KINDS) {
    if (!versions.some((v) => v.persona === kind)) {
      versions.push({
        persona: kind,
        label: PERSONA_LABELS[kind],
        summary: "",
        sections: [],
        highlightBullets: [],
      });
    }
  }

  return {
    baseSummary: parsed.baseSummary ?? "",
    versions,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get highlight bullets for a given persona (e.g. for JobHunter tailoring).
 */
export function getHighlightBullets(
  output: PersonaEngineOutput,
  persona: PersonaKind
): string[] {
  const v = output.versions.find((x) => x.persona === persona);
  return v?.highlightBullets ?? [];
}

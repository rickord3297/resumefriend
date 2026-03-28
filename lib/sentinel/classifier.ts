import OpenAI from "openai";
import { sentinelConfig, isOpenAIConfigured } from "./config";
import type { EmailClassification, EmailSentiment } from "@/types/sentinel";

const LABELS: EmailClassification[] = [
  "Interview Request",
  "Rejection",
  "Follow-up",
  "Status Update",
];

const SENTIMENTS: EmailSentiment[] = ["positive", "neutral", "negative", "mixed"];

export interface EmailInsight {
  classification: EmailClassification;
  sentiment: EmailSentiment;
  summary: string;
  suggestedStartIso?: string | null;
  suggestedEventTitle?: string | null;
}

const JSON_INSTRUCTION = `Return a JSON object with keys:
- "classification": one of ${LABELS.map((l) => `"${l}"`).join(", ")}
- "sentiment": one of "positive", "neutral", "negative", "mixed" (from the job seeker's perspective: positive = good news or momentum, negative = rejection or bad news, mixed = both, neutral = procedural)
- "summary": one short sentence (max 140 chars) for a dashboard
- "suggestedStartIso": optional ISO 8601 datetime string if the email proposes a specific interview/call time you can parse; else null
- "suggestedEventTitle": optional short title for calendar (e.g. "Acme — phone screen"); else null

Rules:
- Interview Request: scheduling an interview, phone screen, Zoom, calendar invite language.
- Rejection: not moving forward, chose another candidate, position filled negatively.
- Status Update: application received, still reviewing, pipeline update, timing, next steps without a firm invite.
- Follow-up: generic check-in, "following up", unrelated thread.`;

export async function classifyEmailInsight(args: {
  snippet: string;
  from: string;
  subject: string;
}): Promise<EmailInsight> {
  if (!isOpenAIConfigured()) {
    return fallbackInsight(args.snippet, args.subject, args.from);
  }
  const openai = new OpenAI({ apiKey: sentinelConfig.openaiApiKey });
  const user = `From: ${args.from}\nSubject: ${args.subject}\nSnippet: ${args.snippet}\n\n${JSON_INSTRUCTION}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: user }],
    max_tokens: 220,
    response_format: { type: "json_object" },
  });
  const text = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const classification = normalizeClassification(String(parsed.classification ?? ""));
    const sentiment = normalizeSentiment(String(parsed.sentiment ?? ""));
    const summary = clampSummary(String(parsed.summary ?? ""));
    const suggestedStartIso =
      typeof parsed.suggestedStartIso === "string" && parsed.suggestedStartIso.length > 8
        ? parsed.suggestedStartIso
        : null;
    const suggestedEventTitle =
      typeof parsed.suggestedEventTitle === "string" && parsed.suggestedEventTitle.length > 0
        ? String(parsed.suggestedEventTitle).slice(0, 120)
        : null;
    return {
      classification,
      sentiment,
      summary: summary || `${classification} — ${args.subject.slice(0, 80)}`,
      suggestedStartIso,
      suggestedEventTitle,
    };
  } catch {
    return fallbackInsight(args.snippet, args.subject, args.from);
  }
}

/** Legacy single-label API (uses the same model path). */
export async function classifyEmail(args: {
  snippet: string;
  from: string;
  subject: string;
}): Promise<EmailClassification> {
  const insight = await classifyEmailInsight(args);
  return insight.classification;
}

function normalizeClassification(raw: string): EmailClassification {
  const t = raw.trim();
  for (const label of LABELS) {
    if (t.toLowerCase().includes(label.toLowerCase())) return label;
  }
  return "Follow-up";
}

function normalizeSentiment(raw: string): EmailSentiment {
  const t = raw.toLowerCase();
  for (const s of SENTIMENTS) {
    if (t.includes(s)) return s;
  }
  return "neutral";
}

function clampSummary(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 140 ? t.slice(0, 137) + "…" : t;
}

function fallbackInsight(snippet: string, subject: string, from: string): EmailInsight {
  const classification = fallbackClassifyLabel(snippet, subject);
  const lower = `${subject} ${snippet}`.toLowerCase();
  let sentiment: EmailSentiment = "neutral";
  if (classification === "Rejection") sentiment = "negative";
  else if (
    /congratulations|excited|invite|looking forward|next round|offer/i.test(lower)
  )
    sentiment = "positive";
  else if (/unfortunately|not selected|not move forward/i.test(lower)) sentiment = "negative";
  else if (classification === "Interview Request") sentiment = "positive";

  const summary =
    classification === "Interview Request"
      ? "Interview or scheduling request in inbox — review thread."
      : classification === "Rejection"
        ? "Rejection or closed-loop message."
        : classification === "Status Update"
          ? "Application / pipeline status update."
          : "Recruiter follow-up — skim for action items.";

  const dateGuess = parseLooseDate(lower);
  return {
    classification,
    sentiment,
    summary,
    suggestedStartIso: dateGuess,
    suggestedEventTitle: classification === "Interview Request" ? subject.slice(0, 80) : null,
  };
}

function fallbackClassifyLabel(snippet: string, subject: string): EmailClassification {
  const lower = `${subject} ${snippet}`.toLowerCase();
  if (
    /interview|schedule|phone screen|zoom|teams meeting|calendar|time slot|book a call|availab/i.test(
      lower
    )
  )
    return "Interview Request";
  if (
    /reject|not moving forward|other candidate|unfortunately|decided to go with|not selected/i.test(
      lower
    )
  )
    return "Rejection";
  if (
    /application received|still reviewing|pipeline|status of your application|next steps in process/i.test(
      lower
    )
  )
    return "Status Update";
  return "Follow-up";
}

/** Very light date extraction (fallback without LLM). */
function parseLooseDate(lower: string): string | null {
  const m = lower.match(
    /(\b(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\b[^0-9]{0,20}\d{1,2}(?:st|nd|rd|th)?[^0-9]{0,15}\d{0,4}\s+(?:at\s+)?\d{1,2}:\d{2}\s*(?:am|pm)?)/i
  );
  if (!m) return null;
  const tryParse = Date.parse(m[1]);
  if (!Number.isNaN(tryParse) && tryParse > Date.now()) return new Date(tryParse).toISOString();
  return null;
}

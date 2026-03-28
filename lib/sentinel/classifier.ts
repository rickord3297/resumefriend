import OpenAI from "openai";
import { sentinelConfig, isOpenAIConfigured } from "./config";
import type { EmailClassification } from "@/types/sentinel";

const LABELS: EmailClassification[] = ["Interview Request", "Rejection", "Follow-up"];

export async function classifyEmail(args: {
  snippet: string;
  from: string;
  subject: string;
}): Promise<EmailClassification> {
  if (!isOpenAIConfigured()) {
    return fallbackClassify(args.snippet, args.subject);
  }
  const openai = new OpenAI({ apiKey: sentinelConfig.openaiApiKey });
  const prompt = `You are an email classifier for a job seeker. Classify this email into exactly one of: ${LABELS.join(", ")}.

Rules:
- "Interview Request": recruiter or company asks to schedule an interview, phone screen, or meeting.
- "Rejection": rejection, not moving forward, or similar negative outcome.
- "Follow-up": checking in, status update request, or general follow-up (not an interview invite).

Email:
From: ${args.from}
Subject: ${args.subject}
Snippet: ${args.snippet}

Reply with only one of these exact words: ${LABELS.join(", ")}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 20,
  });
  const text = (completion.choices[0]?.message?.content ?? "").trim();
  for (const label of LABELS) {
    if (text.toLowerCase().includes(label.toLowerCase())) return label;
  }
  return "Follow-up";
}

function fallbackClassify(snippet: string, subject: string): EmailClassification {
  const lower = `${subject} ${snippet}`.toLowerCase();
  if (
    /interview|schedule|call|phone screen|meet|zoom|calendar|available|time slot/i.test(lower)
  )
    return "Interview Request";
  if (
    /reject|not moving forward|other candidate|unfortunately|decided to go with/i.test(lower)
  )
    return "Rejection";
  return "Follow-up";
}

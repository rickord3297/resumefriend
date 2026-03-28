import OpenAI from "openai";
import { sentinelConfig, isOpenAIConfigured } from "./config";
import { createDraftReply } from "./gmail";
import type { CalendarAvailability } from "@/types/sentinel";

/**
 * For an "Interview Request" email, generate a suggested reply that includes
 * the user's calendar availability and save it as a Gmail draft.
 */
export async function generateAndSaveDraft(args: {
  threadId: string;
  subject: string;
  from: string;
  emailSnippet: string;
  calendarAvailability: CalendarAvailability;
}): Promise<{ draftId: string; suggestedReply: string }> {
  const suggestedReply = await generateSuggestedReply({
    from: args.from,
    subject: args.subject,
    emailSnippet: args.emailSnippet,
    calendarAvailability: args.calendarAvailability,
  });
  const draftId = await createDraftReply(args.threadId, suggestedReply, args.subject);
  return { draftId, suggestedReply };
}

async function generateSuggestedReply(args: {
  from: string;
  subject: string;
  emailSnippet: string;
  calendarAvailability: CalendarAvailability;
}): Promise<string> {
  const avail = args.calendarAvailability;
  const availabilityText = [
    avail.weekdays?.length ? `Available weekdays: ${avail.weekdays.join(", ")}` : "",
    avail.window ? `Preferred time: ${avail.window.start}–${avail.window.end} (local)` : "",
    avail.timezone ? `Timezone: ${avail.timezone}` : "",
    avail.notes ? `Notes: ${avail.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (!isOpenAIConfigured()) {
    return fallbackReply(availabilityText, args.from);
  }

  const openai = new OpenAI({ apiKey: sentinelConfig.openaiApiKey });
  const prompt = `You are helping a job seeker reply to an interview scheduling request. Write a short, professional reply that:
1. Thanks them and confirms interest.
2. Suggests availability based on the following calendar availability (use it to propose 2-3 concrete options if possible):
${availabilityText || "No specific availability provided; suggest flexibility and ask for their preferred times."}
3. Keeps the tone polite and concise.

Original email:
From: ${args.from}
Subject: ${args.subject}
Snippet: ${args.emailSnippet}

Write only the email body, no subject or headers.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
  });
  return (completion.choices[0]?.message?.content ?? fallbackReply(availabilityText, args.from)).trim();
}

function fallbackReply(availabilityText: string, from: string): string {
  return [
    "Thank you for reaching out and for the opportunity to interview.",
    availabilityText
      ? `Based on my current schedule, I have availability as follows: ${availabilityText} I’m happy to work around your calendar as well.`
      : "I’m flexible and happy to find a time that works for both of us.",
    "Please let me know what works best for you.",
    "",
    "Best regards",
  ].join("\n");
}

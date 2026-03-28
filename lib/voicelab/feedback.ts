/**
 * VoiceLab: Instant Feedback analysis.
 * Content: did they answer the prompt? Confidence: filler count, tone. Alignment: match to Resume Persona.
 */

import OpenAI from "openai";
import type { VoiceLabFeedback } from "@/types/voicelab";

const FILLER_PATTERN = /\b(um|uh|like|you know|basically|actually|literally|so yeah|kind of|sort of|i mean)\b/gi;

function countFillers(transcript: string): { count: number; words: string[] } {
  const words: string[] = [];
  let count = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(FILLER_PATTERN.source, "gi");
  while ((m = re.exec(transcript)) !== null) {
    count++;
    const w = m[1].toLowerCase();
    if (!words.includes(w)) words.push(w);
  }
  return { count, words };
}

export async function analyzeRecording(args: {
  prompt: string;
  transcript: string;
  personaLabel: string;
  personaSummaryOrBullets: string; // summary or bullets for alignment check
}): Promise<VoiceLabFeedback> {
  const openai = getOpenAI();
  const { count: fillerCount, words: fillerWords } = countFillers(args.transcript);
  const wordCount = args.transcript.trim().split(/\s+/).filter(Boolean).length;
  const fillerScore = wordCount > 0 ? Math.max(0, 100 - (fillerCount / wordCount) * 200) : 100;

  if (!openai) {
    return {
      questionId: "",
      prompt: args.prompt,
      transcript: args.transcript,
      content: {
        answeredPrompt: wordCount > 10,
        score: wordCount > 10 ? 70 : 30,
        summary: "OpenAI not configured; content score is heuristic.",
      },
      confidence: {
        fillerWordCount: fillerCount,
        fillerWords,
        fillerScore: Math.round(fillerScore),
        toneSummary: "Tone analysis requires OPENAI_API_KEY.",
      },
      alignment: {
        personaLabel: args.personaLabel,
        alignmentScore: 50,
        summary: "Alignment analysis requires OPENAI_API_KEY.",
      },
      generatedAt: new Date().toISOString(),
    };
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an interview coach. Analyze a candidate's spoken answer. Output valid JSON only.
Keys: answeredPrompt (boolean), contentScore (0-100), contentSummary (1-2 sentences), suggestedImprovements (string[] optional),
toneSummary (1 sentence), toneScore (0-100), alignmentScore (0-100), alignmentSummary (1-2 sentences), matchedThemes (string[] optional), missedOpportunities (string[] optional).`,
      },
      {
        role: "user",
        content: `Question: ${args.prompt}
Candidate's answer (transcript): ${args.transcript}
Resume Persona for alignment: ${args.personaLabel}. Context: ${args.personaSummaryOrBullets.slice(0, 1500)}

Provide scores and short summaries. Did they answer the question? How's tone? How well does the answer align with their resume persona?`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 600,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const data = JSON.parse(raw);

  return {
    questionId: "",
    prompt: args.prompt,
    transcript: args.transcript,
    content: {
      answeredPrompt: !!data.answeredPrompt,
      score: Math.min(100, Math.max(0, Number(data.contentScore) ?? 70)),
      summary: data.contentSummary ?? "",
      suggestedImprovements: data.suggestedImprovements ?? [],
    },
    confidence: {
      fillerWordCount: fillerCount,
      fillerWords,
      fillerScore: Math.round(fillerScore),
      toneSummary: data.toneSummary ?? "",
      toneScore: data.toneScore != null ? Math.min(100, Math.max(0, Number(data.toneScore))) : undefined,
    },
    alignment: {
      personaLabel: args.personaLabel,
      alignmentScore: Math.min(100, Math.max(0, Number(data.alignmentScore) ?? 50)),
      summary: data.alignmentSummary ?? "",
      matchedThemes: data.matchedThemes,
      missedOpportunities: data.missedOpportunities,
    },
    generatedAt: new Date().toISOString(),
  };
}

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  return key ? new OpenAI({ apiKey: key }) : null;
}

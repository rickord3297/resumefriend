import { NextResponse } from "next/server";
import { analyzeRecording } from "@/lib/voicelab";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { prompt, transcript, personaLabel, personaSummaryOrBullets } = body;
    if (!prompt?.trim() || !transcript?.trim()) {
      return NextResponse.json(
        { error: "prompt and transcript are required" },
        { status: 400 }
      );
    }
    const result = await analyzeRecording({
      prompt: String(prompt).trim(),
      transcript: String(transcript).trim(),
      personaLabel: personaLabel ?? "Generalist",
      personaSummaryOrBullets: personaSummaryOrBullets ?? "",
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Feedback analysis failed" },
      { status: 500 }
    );
  }
}

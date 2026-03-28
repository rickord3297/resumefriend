import { NextResponse } from "next/server";
import { DEFAULT_QUESTIONS } from "@/lib/voicelab";

export async function GET() {
  return NextResponse.json({ questions: DEFAULT_QUESTIONS });
}

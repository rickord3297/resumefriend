import { NextResponse } from "next/server";
import { generatePersonas } from "@/lib/persona-engine";
import type { PersonaEngineInput } from "@/types/persona";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PersonaEngineInput;
    if (!body.sourceText?.trim()) {
      return NextResponse.json({ error: "sourceText is required" }, { status: 400 });
    }
    const result = await generatePersonas(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Persona generation failed" },
      { status: 500 }
    );
  }
}

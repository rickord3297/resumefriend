import { NextResponse } from "next/server";
import { draftOutreachSequence } from "@/lib/job-hunter";
import type { PersonaKind } from "@/types/persona";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      companyName,
      contactName,
      contactTitle,
      personaBullets,
      personaLabel,
      roleOrTitle,
      research,
    } = body;
    if (!companyName?.trim()) {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 });
    }
    if (!Array.isArray(personaBullets) || personaBullets.length === 0) {
      return NextResponse.json(
        { error: "personaBullets array (from PersonaEngine) is required" },
        { status: 400 }
      );
    }
    const result = await draftOutreachSequence({
      companyName: String(companyName).trim(),
      contactName,
      contactTitle,
      research,
      personaBullets,
      personaLabel: personaLabel ?? "Generalist",
      roleOrTitle,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sequence draft failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { isDemoSeedAllowed, runFullDemoSeed } from "@/lib/demo-seed";

/**
 * POST /api/demo/seed
 * Loads sample calendar interviews, analytics, and profile resumes (local / ALLOW_DEMO_SEED only).
 */
export async function POST() {
  if (!isDemoSeedAllowed()) {
    return NextResponse.json({ error: "Demo seed is not enabled." }, { status: 403 });
  }
  try {
    await runFullDemoSeed();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Seed failed" },
      { status: 500 }
    );
  }
}

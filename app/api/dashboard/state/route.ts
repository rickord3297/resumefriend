import { NextResponse } from "next/server";
import { getDashboardState } from "@/lib/dashboard-store";
import { isDemoSeedAllowed } from "@/lib/demo-seed";

/**
 * GET /api/dashboard/state
 * Returns current Dashboard state (prep mode windows) for the Dashboard UI.
 */
export async function GET() {
  try {
    const state = await getDashboardState();
    return NextResponse.json({
      ...state,
      demoSeedAllowed: isDemoSeedAllowed(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load state" },
      { status: 500 }
    );
  }
}

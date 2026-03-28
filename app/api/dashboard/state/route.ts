import { NextResponse } from "next/server";
import { getDashboardState } from "@/lib/dashboard-store";

/**
 * GET /api/dashboard/state
 * Returns current Dashboard state (prep mode windows) for the Dashboard UI.
 */
export async function GET() {
  try {
    const state = await getDashboardState();
    return NextResponse.json(state);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load state" },
      { status: 500 }
    );
  }
}

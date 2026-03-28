import { NextResponse } from "next/server";
import { scanInboxAndPersist } from "@/lib/inbox-intelligence";
import { getDashboardState } from "@/lib/dashboard-store";
import { isDemoSeedAllowed } from "@/lib/demo-seed";

/**
 * POST /api/dashboard/scan-inbox
 * Lists recent Gmail threads, classifies + sentiment, merges into dashboard inboxSignals.
 * Requires Google OAuth env vars. Optional ?demo=1 uses demo data when demo seed is allowed.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("demo") === "1" && isDemoSeedAllowed()) {
      const { seedDemoInboxOnly } = await import("@/lib/demo-seed");
      await seedDemoInboxOnly();
      const state = await getDashboardState();
      return NextResponse.json({
        ok: true,
        demo: true,
        scanned: state.inboxSignals.length,
        lastInboxScanAt: state.lastInboxScanAt,
      });
    }

    const result = await scanInboxAndPersist();
    if (result.error && result.scanned === 0) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    const state = await getDashboardState();
    return NextResponse.json({
      ok: true,
      scanned: result.scanned,
      lastInboxScanAt: state.lastInboxScanAt,
      error: result.error,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Scan failed" },
      { status: 500 }
    );
  }
}

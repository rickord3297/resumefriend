import { NextResponse } from "next/server";
import { runSentinel } from "@/lib/sentinel";
import type { CalendarAvailability } from "@/types/sentinel";

/**
 * POST /api/sentinel/run
 * Run one Sentinel cycle (Gmail poll + classify + Calendar prep windows + Action Engine drafts).
 * Body (optional): { calendarAvailability?: CalendarAvailability, calendarOnly?: boolean, gmailOnly?: boolean }
 */
export async function POST(request: Request) {
  try {
    let body: {
      calendarAvailability?: CalendarAvailability;
      calendarOnly?: boolean;
      gmailOnly?: boolean;
    } = {};
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      body = await request.json();
    }
    const result = await runSentinel({
      calendarAvailability: body.calendarAvailability,
      calendarOnly: body.calendarOnly,
      gmailOnly: body.gmailOnly,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sentinel run failed" },
      { status: 500 }
    );
  }
}

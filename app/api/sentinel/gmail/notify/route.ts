import { NextResponse } from "next/server";
import { runSentinel } from "@/lib/sentinel";

/**
 * POST /api/sentinel/gmail/notify
 * Webhook for Gmail push notifications (Pub/Sub push subscription).
 * When Gmail sends a notification, Pub/Sub forwards here. We run a Sentinel cycle
 * to process new mail. Expects Pub/Sub push format: { message: { data, messageId } }.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const _message = body.message;
    // Optional: decode message.data to get historyId and only fetch since then
    const result = await runSentinel({});
    return NextResponse.json({ ok: true, sentinel: result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Notify failed" },
      { status: 500 }
    );
  }
}

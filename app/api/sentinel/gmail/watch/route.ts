import { NextResponse } from "next/server";
import { watchGmail } from "@/lib/sentinel";
import { sentinelConfig } from "@/lib/sentinel/config";

/**
 * POST /api/sentinel/gmail/watch
 * Start Gmail watch (requires GMAIL_WATCH_TOPIC and Pub/Sub set up).
 * Returns historyId and expiration; you must renew before expiration.
 */
export async function POST() {
  const topic = sentinelConfig.gmailWatchTopic;
  if (!topic) {
    return NextResponse.json(
      { error: "GMAIL_WATCH_TOPIC not set. Set it to your Pub/Sub topic (e.g. projects/my-project/topics/gmail)" },
      { status: 400 }
    );
  }
  try {
    const result = await watchGmail(topic);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Watch failed" },
      { status: 500 }
    );
  }
}

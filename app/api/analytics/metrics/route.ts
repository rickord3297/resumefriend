import { NextResponse } from "next/server";
import {
  getApplications,
  getCommunications,
  getInterviews,
  computeMetrics,
} from "@/lib/analytics-store";

export async function GET() {
  try {
    const [applications, communications, interviews] = await Promise.all([
      getApplications(),
      getCommunications(),
      getInterviews(),
    ]);
    const metrics = computeMetrics(applications, communications, interviews);
    return NextResponse.json(metrics);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to compute metrics" },
      { status: 500 }
    );
  }
}

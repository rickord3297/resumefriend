import { NextResponse } from "next/server";
import { getActivity } from "@/lib/analytics-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const items = await getActivity(limit);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load activity" },
      { status: 500 }
    );
  }
}

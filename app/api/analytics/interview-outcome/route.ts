import { NextResponse } from "next/server";
import { setInterviewOutcome, getInterviews, addActivity } from "@/lib/analytics-store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { calendarEventId, pm_score } = body;
    if (!calendarEventId || ![1, 2, 3].includes(Number(pm_score))) {
      return NextResponse.json(
        { error: "calendarEventId and pm_score (1, 2, or 3) required" },
        { status: 400 }
      );
    }
    const interviews = await getInterviews();
    const interview = interviews.find(
      (i) => i.calendarEventId === calendarEventId || i.id === calendarEventId
    );
    const id = interview?.id ?? calendarEventId;
    await setInterviewOutcome(id, Number(pm_score) as 1 | 2 | 3);
    const labels = { 1: "Stumbled", 2: "Average", 3: "Nailed it" };
    await addActivity({
      at: new Date().toISOString(),
      type: "interview_outcome",
      title: `Interview: ${labels[Number(pm_score) as 1 | 2 | 3]}`,
      meta: interview?.eventTitle,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to record outcome" },
      { status: 500 }
    );
  }
}

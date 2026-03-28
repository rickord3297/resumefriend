import { NextResponse } from "next/server";

const EDGE_TIPS = [
  "Send a thank-you note within 24 hours of every interview—recruiters notice.",
  "Research the company's recent product launches before the call.",
  "Prepare 2-3 questions that show you've read the job description.",
  "Mirror the interviewer's energy and pace to build rapport.",
  "Use the STAR method for behavioral questions: Situation, Task, Action, Result.",
  "Follow up with a LinkedIn connection request after a strong interview.",
  "Know your salary range and anchor high when they ask.",
  "Small talk at the start matters—comment on something specific (office, team, product).",
];

export async function GET() {
  return NextResponse.json({ tips: EDGE_TIPS });
}

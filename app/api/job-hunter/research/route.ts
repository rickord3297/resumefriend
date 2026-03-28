import { NextResponse } from "next/server";
import { researchCompany } from "@/lib/job-hunter";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const companyName = body.companyName ?? body.company;
    if (!companyName?.trim()) {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 });
    }
    const result = await researchCompany(String(companyName).trim());
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Research failed" },
      { status: 500 }
    );
  }
}

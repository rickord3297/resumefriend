import { NextResponse } from "next/server";
import { getProfile, setProfile, setPrimaryResume, updateCareerDNA } from "@/lib/profile-store";

export async function GET() {
  try {
    const profile = await getProfile();
    return NextResponse.json(profile);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const profile = await getProfile();

    if (body.primaryResumeId != null) {
      await setPrimaryResume(body.primaryResumeId);
      const updated = await getProfile();
      return NextResponse.json(updated);
    }
    if (body.careerDNA != null) {
      await updateCareerDNA(body.careerDNA);
      const updated = await getProfile();
      return NextResponse.json(updated);
    }
    return NextResponse.json(profile);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}

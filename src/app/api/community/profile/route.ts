import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getMemberProfile } from "@/lib/circle/headless-member";

export async function GET() {
  try {
    const session = await requireMemberAuth();
    const data = await getMemberProfile(session.accessToken);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

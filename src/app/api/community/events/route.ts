import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getCommunityEvents } from "@/lib/circle/headless-member";

export async function GET(req: NextRequest) {
  try {
    const session = await requireMemberAuth();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const per_page = Number(searchParams.get("per_page")) || 50;
    const past_events = searchParams.get("past_events") === "true";

    const data = await getCommunityEvents(session.accessToken, {
      page,
      per_page,
      past_events,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch events";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

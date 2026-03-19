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
    const status = searchParams.get("status") || undefined;
    const filter_date_start = searchParams.get("filter_date[start_date]") || undefined;
    const filter_date_end = searchParams.get("filter_date[end_date]") || undefined;

    const data = await getCommunityEvents(session.accessToken, {
      page,
      per_page,
      past_events,
      status,
      filter_date_start,
      filter_date_end,
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

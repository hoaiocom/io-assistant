import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getCommunityMembers } from "@/lib/circle/headless-member";

export async function GET(req: NextRequest) {
  try {
    const session = await requireMemberAuth();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const per_page = Number(searchParams.get("per_page")) || 20;
    const search_text = searchParams.get("search_text") || undefined;
    const sort = searchParams.get("sort") || undefined;
    const space_id = searchParams.get("space_id")
      ? Number(searchParams.get("space_id"))
      : undefined;

    const data = await getCommunityMembers(session.accessToken, {
      page,
      per_page,
      search_text,
      sort,
      space_id,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch members";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

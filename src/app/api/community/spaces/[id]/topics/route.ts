import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getSpaceTopics } from "@/lib/circle/headless-member";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const per_page = Number(searchParams.get("per_page")) || 50;

    const data = await getSpaceTopics(session.accessToken, Number(id), { page, per_page });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch topics";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


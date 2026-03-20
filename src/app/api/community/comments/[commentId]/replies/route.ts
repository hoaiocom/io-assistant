import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { createReply, getCommentReplies } from "@/lib/circle/headless-member";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { commentId } = await params;
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const per_page = Number(searchParams.get("per_page")) || 20;
    const sort = searchParams.get("sort") || undefined;
    const data = await getCommentReplies(session.accessToken, Number(commentId), {
      page,
      per_page,
      sort,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { commentId } = await params;
    const body = await req.json();
    const data = await createReply(session.accessToken, Number(commentId), body);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

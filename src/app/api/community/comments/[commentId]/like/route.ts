import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { likeComment, unlikeComment } from "@/lib/circle/headless-member";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { commentId } = await params;
    const data = await likeComment(session.accessToken, Number(commentId));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ commentId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { commentId } = await params;
    const data = await unlikeComment(session.accessToken, Number(commentId));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

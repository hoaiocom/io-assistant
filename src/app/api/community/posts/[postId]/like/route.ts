import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { likePost, unlikePost } from "@/lib/circle/headless-member";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { postId } = await params;
    const data = await likePost(session.accessToken, Number(postId));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to like post";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { postId } = await params;
    const data = await unlikePost(session.accessToken, Number(postId));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to unlike post";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

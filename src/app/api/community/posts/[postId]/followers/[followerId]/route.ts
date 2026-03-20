import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { unfollowPostByFollowerId } from "@/lib/circle/headless-member";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string; followerId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { postId, followerId } = await params;
    const data = await unfollowPostByFollowerId(
      session.accessToken,
      Number(postId),
      Number(followerId),
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to unfollow post";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

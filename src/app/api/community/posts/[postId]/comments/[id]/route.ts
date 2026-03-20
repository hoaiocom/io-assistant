import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { deleteComment } from "@/lib/circle/headless-member";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string; id: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { postId, id } = await params;
    const data = await deleteComment(session.accessToken, Number(postId), Number(id));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete comment";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

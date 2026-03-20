import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { deleteReply } from "@/lib/circle/headless-member";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ commentId: string; id: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { commentId, id } = await params;
    const data = await deleteReply(session.accessToken, Number(commentId), Number(id));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete reply";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

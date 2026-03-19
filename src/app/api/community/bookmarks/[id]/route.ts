import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { deleteBookmark } from "@/lib/circle/headless-member";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { id } = await params;
    const data = await deleteBookmark(session.accessToken, Number(id));
    return NextResponse.json(data ?? { success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete bookmark";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

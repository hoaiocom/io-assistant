import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteComment } from "@/lib/circle/posts";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteComment(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete comment" },
      { status: 500 },
    );
  }
}

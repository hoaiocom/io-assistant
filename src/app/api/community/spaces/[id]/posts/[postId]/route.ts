import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getPostDetail } from "@/lib/circle/headless-member";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; postId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { id, postId } = await params;
    const data = await getPostDetail(session.accessToken, Number(id), Number(postId));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch post";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

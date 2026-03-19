import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { markChatRoomAsRead } from "@/lib/circle/headless-member";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { uuid } = await params;
    const data = await markChatRoomAsRead(session.accessToken, uuid);
    return NextResponse.json(data ?? { success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark as read";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

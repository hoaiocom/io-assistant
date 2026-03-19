import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getChatRoom } from "@/lib/circle/headless-member";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { uuid } = await params;
    const data = await getChatRoom(session.accessToken, uuid);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch chat room";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getChatMessage } from "@/lib/circle/headless-member";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string; id: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { uuid, id } = await params;
    const data = await getChatMessage(session.accessToken, uuid, Number(id));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch message";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


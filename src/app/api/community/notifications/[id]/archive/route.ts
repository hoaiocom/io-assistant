import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { archiveNotification } from "@/lib/circle/headless-member";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { id } = await params;
    const data = await archiveNotification(session.accessToken, Number(id));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to archive notification";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { addReaction, removeReaction } from "@/lib/circle/headless-member";

export async function POST(req: NextRequest) {
  try {
    const session = await requireMemberAuth();
    const body = await req.json();
    const data = await addReaction(session.accessToken, body);
    return NextResponse.json(data ?? { success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add reaction";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireMemberAuth();
    const body = await req.json();
    const data = await removeReaction(session.accessToken, body);
    return NextResponse.json(data ?? { success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove reaction";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

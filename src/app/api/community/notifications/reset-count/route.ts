import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { resetNewNotificationsCount } from "@/lib/circle/headless-member";

export async function POST() {
  try {
    const session = await requireMemberAuth();
    const data = await resetNewNotificationsCount(session.accessToken);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reset notification count";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

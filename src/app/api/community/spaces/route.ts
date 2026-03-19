import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getSpaces } from "@/lib/circle/headless-member";

export async function GET() {
  try {
    const session = await requireMemberAuth();
    const data = await getSpaces(session.accessToken);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch spaces";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import {
  getNotifications,
  markAllNotificationsRead,
  getNewNotificationsCount,
} from "@/lib/circle/headless-member";

export async function GET(req: NextRequest) {
  try {
    const session = await requireMemberAuth();
    const { searchParams } = new URL(req.url);

    if (searchParams.get("count") === "true") {
      const data = await getNewNotificationsCount(session.accessToken);
      return NextResponse.json(data);
    }

    const page = Number(searchParams.get("page")) || 1;
    const per_page = Number(searchParams.get("per_page")) || 20;
    const data = await getNotifications(session.accessToken, { page, per_page });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch notifications";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await requireMemberAuth();
    const data = await markAllNotificationsRead(session.accessToken);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark notifications read";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

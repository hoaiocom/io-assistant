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
    const sort = searchParams.get("sort");
    const status = searchParams.get("status");
    const notificationType = searchParams.get("notification_type");
    const data = await getNotifications(session.accessToken, {
      page,
      per_page,
      ...(sort ? { sort: sort as "oldest" | "latest" } : {}),
      ...(status ? { status: status as "all" | "read" | "unread" } : {}),
      ...(notificationType ? { notification_type: notificationType } : {}),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch notifications";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireMemberAuth();
    const body = (await req.json().catch(() => ({}))) as {
      notification_type?: string;
    };
    const data = await markAllNotificationsRead(session.accessToken, {
      notification_type: body.notification_type,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark notifications read";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

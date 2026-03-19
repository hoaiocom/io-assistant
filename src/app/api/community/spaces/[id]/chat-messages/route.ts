import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import {
  getSpaceChatMessages,
  sendSpaceChatMessage,
} from "@/lib/circle/headless-member";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const refId = searchParams.get("id")
      ? Number(searchParams.get("id"))
      : undefined;
    const previous_per_page = searchParams.get("previous_per_page")
      ? Number(searchParams.get("previous_per_page"))
      : undefined;
    const next_per_page = searchParams.get("next_per_page")
      ? Number(searchParams.get("next_per_page"))
      : undefined;

    const data = await getSpaceChatMessages(session.accessToken, Number(id), {
      id: refId,
      previous_per_page,
      next_per_page,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch messages";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { id } = await params;
    const body = await req.json();
    const data = await sendSpaceChatMessage(
      session.accessToken,
      Number(id),
      body,
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send message";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listEventAttendees, addEventAttendee, removeEventAttendee } from "@/lib/circle/events";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const per_page = searchParams.get("per_page");

    const attendees = await listEventAttendees(Number(id), {
      ...(page && { page: Number(page) }),
      ...(per_page && { per_page: Number(per_page) }),
    });
    return NextResponse.json(attendees);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list event attendees" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const attendee = await addEventAttendee({
      event_id: Number(id),
      member_email: body.member_email,
    });
    return NextResponse.json(attendee, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add event attendee" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const member_email = searchParams.get("member_email");
    if (!member_email) {
      return NextResponse.json({ error: "member_email is required" }, { status: 400 });
    }
    await removeEventAttendee({ event_id: Number(id), member_email });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove event attendee" },
      { status: 500 },
    );
  }
}

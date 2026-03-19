import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listEvents, createEvent } from "@/lib/circle/events";

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const per_page = searchParams.get("per_page");
    const space_id = searchParams.get("space_id");

    const events = await listEvents({
      ...(page && { page: Number(page) }),
      ...(per_page && { per_page: Number(per_page) }),
      ...(space_id && { space_id: Number(space_id) }),
    });
    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list events" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const event = await createEvent(body);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create event" },
      { status: 500 },
    );
  }
}

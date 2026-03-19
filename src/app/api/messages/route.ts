import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createMessage } from "@/lib/circle/admin-extras";

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const message = await createMessage(body);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create message" },
      { status: 500 },
    );
  }
}

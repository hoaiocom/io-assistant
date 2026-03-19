import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { banMember } from "@/lib/circle/members";

export async function PUT(
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
    await banMember(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to ban member" },
      { status: 500 },
    );
  }
}

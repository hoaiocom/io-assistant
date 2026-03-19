import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateProfileField } from "@/lib/circle/admin-extras";

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
    const body = await request.json();
    const field = await updateProfileField(Number(id), body);
    return NextResponse.json(field);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile field" },
      { status: 500 },
    );
  }
}

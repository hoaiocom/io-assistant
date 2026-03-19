import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { revokeInvitationLink } from "@/lib/circle/admin-extras";

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
    await revokeInvitationLink(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revoke invitation link" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMemberStats, getSpaceStats, getContentStats } from "@/lib/circle/analytics";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [members, spaces, content] = await Promise.all([
      getMemberStats(),
      getSpaceStats(),
      getContentStats(),
    ]);

    return NextResponse.json({ members, spaces, content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}

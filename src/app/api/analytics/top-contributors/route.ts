import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTopContributors } from "@/lib/circle/analytics";

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const contributors = await getTopContributors(limit ? Number(limit) : undefined);
    return NextResponse.json(contributors);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch top contributors" },
      { status: 500 },
    );
  }
}

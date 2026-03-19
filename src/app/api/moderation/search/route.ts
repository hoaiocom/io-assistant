import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { advancedSearch } from "@/lib/circle/moderation";

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const type = searchParams.get("type");
    const page = searchParams.get("page");
    const per_page = searchParams.get("per_page");

    const results = await advancedSearch({
      query,
      ...(type && { type }),
      ...(page && { page: Number(page) }),
      ...(per_page && { per_page: Number(per_page) }),
    });
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search" },
      { status: 500 },
    );
  }
}

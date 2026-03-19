import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchMembers } from "@/lib/circle/members";

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string | number> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const results = await searchMembers(params);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search members" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPostSummary } from "@/lib/circle/posts";

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
    const summary = await getPostSummary(Number(id));
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch post summary" },
      { status: 500 },
    );
  }
}

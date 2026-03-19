import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listFormSubmissions } from "@/lib/circle/admin-extras";

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
    const { searchParams } = new URL(request.url);
    const queryParams: Record<string, string | number> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const submissions = await listFormSubmissions(Number(id), queryParams);
    return NextResponse.json(submissions);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list form submissions" },
      { status: 500 },
    );
  }
}

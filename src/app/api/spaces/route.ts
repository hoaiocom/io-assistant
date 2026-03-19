import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listSpaces, createSpace } from "@/lib/circle/spaces";

export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const per_page = searchParams.get("per_page");
    const sort = searchParams.get("sort");

    const spaces = await listSpaces({
      ...(page && { page: Number(page) }),
      ...(per_page && { per_page: Number(per_page) }),
      ...(sort && { sort }),
    });
    return NextResponse.json(spaces);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list spaces" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const space = await createSpace(body);
    return NextResponse.json(space, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create space" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listSpaceGroups, createSpaceGroup } from "@/lib/circle/spaces";

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

    const groups = await listSpaceGroups({
      ...(page && { page: Number(page) }),
      ...(per_page && { per_page: Number(per_page) }),
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list space groups" },
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
    const group = await createSpaceGroup(body);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create space group" },
      { status: 500 },
    );
  }
}

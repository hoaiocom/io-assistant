import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listAccessGroups, createAccessGroup } from "@/lib/circle/admin-extras";

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

    const groups = await listAccessGroups(params);
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list access groups" },
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
    const group = await createAccessGroup(body);
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create access group" },
      { status: 500 },
    );
  }
}

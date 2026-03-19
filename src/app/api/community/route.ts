import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCommunity, updateCommunity } from "@/lib/circle/community";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const community = await getCommunity();
    return NextResponse.json(community);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch community" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const community = await updateCommunity(body);
    return NextResponse.json(community);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update community" },
      { status: 500 },
    );
  }
}

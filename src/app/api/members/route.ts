import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listMembers, createMember } from "@/lib/circle/members";

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
    const status = searchParams.get("status");

    const members = await listMembers({
      ...(page && { page: Number(page) }),
      ...(per_page && { per_page: Number(per_page) }),
      ...(status && { status }),
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list members" },
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
    const member = await createMember(body);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create member" },
      { status: 500 },
    );
  }
}

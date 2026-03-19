import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  listAccessGroupMembers,
  addMemberToAccessGroup,
  removeMemberFromAccessGroup,
} from "@/lib/circle/admin-extras";

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

    const members = await listAccessGroupMembers(Number(id), queryParams);
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list access group members" },
      { status: 500 },
    );
  }
}

export async function POST(
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
    const body = await request.json();
    const result = await addMemberToAccessGroup(Number(id), body.email);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add member to access group" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    await removeMemberFromAccessGroup(Number(id), email);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove member from access group" },
      { status: 500 },
    );
  }
}

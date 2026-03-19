import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listSpaceMembers, addSpaceMember, removeSpaceMember } from "@/lib/circle/spaces";

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
    const page = searchParams.get("page");
    const per_page = searchParams.get("per_page");

    const members = await listSpaceMembers({
      space_id: Number(id),
      ...(page && { page: Number(page) }),
      ...(per_page && { per_page: Number(per_page) }),
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list space members" },
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
    const member = await addSpaceMember({ space_id: Number(id), email: body.email });
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add space member" },
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
    await removeSpaceMember({ space_id: Number(id), email });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove space member" },
      { status: 500 },
    );
  }
}

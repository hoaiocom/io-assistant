import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listInvitationLinks, createInvitationLink } from "@/lib/circle/admin-extras";

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

    const links = await listInvitationLinks(params);
    return NextResponse.json(links);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list invitation links" },
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
    const link = await createInvitationLink(body);
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invitation link" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listProfileFields, createProfileField } from "@/lib/circle/admin-extras";

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

    const fields = await listProfileFields(params);
    return NextResponse.json(fields);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list profile fields" },
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
    const field = await createProfileField(body);
    return NextResponse.json(field, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create profile field" },
      { status: 500 },
    );
  }
}

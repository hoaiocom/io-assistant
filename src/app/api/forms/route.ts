import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listForms, createForm } from "@/lib/circle/admin-extras";

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

    const forms = await listForms(params);
    return NextResponse.json(forms);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list forms" },
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
    const form = await createForm(body);
    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create form" },
      { status: 500 },
    );
  }
}

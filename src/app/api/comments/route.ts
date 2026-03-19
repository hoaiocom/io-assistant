import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listComments, createComment } from "@/lib/circle/posts";

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
    const space_id = searchParams.get("space_id");
    const post_id = searchParams.get("post_id");
    const search_text = searchParams.get("search_text");

    const comments = await listComments({
      ...(page && { page: Number(page) }),
      ...(per_page && { per_page: Number(per_page) }),
      ...(space_id && { space_id: Number(space_id) }),
      ...(post_id && { post_id: Number(post_id) }),
      ...(search_text && { search_text }),
    });
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list comments" },
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
    const comment = await createComment(body);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create comment" },
      { status: 500 },
    );
  }
}

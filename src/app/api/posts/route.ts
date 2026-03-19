import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listPosts, createPost } from "@/lib/circle/posts";

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
    const status = searchParams.get("status");
    const search_text = searchParams.get("search_text");
    const sort = searchParams.get("sort");

    const posts = await listPosts({
      ...(page && { page: Number(page) }),
      ...(per_page && { per_page: Number(per_page) }),
      ...(space_id && { space_id: Number(space_id) }),
      ...(status && { status }),
      ...(search_text && { search_text }),
      ...(sort && { sort }),
    });
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list posts" },
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
    const post = await createPost(body);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post" },
      { status: 500 },
    );
  }
}

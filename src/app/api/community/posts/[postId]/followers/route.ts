import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getPostFollowers, followPost, unfollowPost } from "@/lib/circle/headless-member";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { postId } = await params;
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const per_page = Number(searchParams.get("per_page")) || 20;
    const data = await getPostFollowers(session.accessToken, Number(postId), { page, per_page });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch post followers";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { postId } = await params;
    const data = await followPost(session.accessToken, Number(postId));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to follow post";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { postId } = await params;
    const data = await unfollowPost(session.accessToken, Number(postId));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to unfollow post";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

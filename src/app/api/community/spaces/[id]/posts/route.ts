import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getSpacePosts, createMemberPost } from "@/lib/circle/headless-member";

function parseTopics(searchParams: URLSearchParams): number[] | undefined {
  const repeated = searchParams.getAll("topics");
  const raw =
    repeated.length > 0
      ? repeated
      : (searchParams.get("topics") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

  const ids = raw
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);

  return ids.length ? ids : undefined;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const per_page = Number(searchParams.get("per_page")) || 20;
    const sort = searchParams.get("sort") || undefined;
    const past_events = searchParams.get("past_events") || undefined;
    const topics = parseTopics(searchParams);

    const data = await getSpacePosts(session.accessToken, Number(id), {
      page,
      per_page,
      sort,
      past_events,
      topics,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch posts";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { id } = await params;
    const body = await req.json();
    const data = await createMemberPost(session.accessToken, Number(id), body);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

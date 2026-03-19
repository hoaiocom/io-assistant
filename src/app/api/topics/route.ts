import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listTopics, createTopic } from "@/lib/circle/posts";

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

    const topics = await listTopics({
      ...(page && { page: Number(page) }),
      ...(per_page && { per_page: Number(per_page) }),
    });
    return NextResponse.json(topics);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list topics" },
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
    const topic = await createTopic(body);
    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create topic" },
      { status: 500 },
    );
  }
}

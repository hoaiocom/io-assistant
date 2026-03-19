import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listCourseLessons, createCourseLesson } from "@/lib/circle/admin-extras";

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

    const lessons = await listCourseLessons(params);
    return NextResponse.json(lessons);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list course lessons" },
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
    const lesson = await createCourseLesson(body);
    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create course lesson" },
      { status: 500 },
    );
  }
}

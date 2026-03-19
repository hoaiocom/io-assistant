import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { updateLessonProgress } from "@/lib/circle/headless-member";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { courseId, lessonId } = await params;
    const body = await req.json();
    const data = await updateLessonProgress(
      session.accessToken,
      Number(courseId),
      Number(lessonId),
      body,
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update progress";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

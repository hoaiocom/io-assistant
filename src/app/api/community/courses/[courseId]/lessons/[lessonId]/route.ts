import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getCourseLesson } from "@/lib/circle/headless-member";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { courseId, lessonId } = await params;
    const data = await getCourseLesson(
      session.accessToken,
      Number(courseId),
      Number(lessonId),
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch lesson";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

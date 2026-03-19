import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getCourseSections } from "@/lib/circle/headless-member";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { courseId } = await params;
    const data = await getCourseSections(session.accessToken, Number(courseId));
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch course";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

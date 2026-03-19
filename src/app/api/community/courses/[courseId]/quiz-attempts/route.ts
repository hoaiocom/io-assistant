import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getCourseQuizAttempts } from "@/lib/circle/headless-member";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { courseId } = await params;
    const url = new URL(req.url);
    const page = url.searchParams.get("page");
    const per_page = url.searchParams.get("per_page");

    const data = await getCourseQuizAttempts(session.accessToken, Number(courseId), {
      ...(page ? { page: Number(page) } : {}),
      ...(per_page ? { per_page: Number(per_page) } : {}),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch quiz attempts";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


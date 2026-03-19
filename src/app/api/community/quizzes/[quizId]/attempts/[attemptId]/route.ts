import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getQuizAttempt } from "@/lib/circle/headless-member";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ quizId: string; attemptId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { quizId, attemptId } = await params;
    const url = new URL(req.url);
    const for_admin_review = url.searchParams.get("for_admin_review");

    const data = await getQuizAttempt(session.accessToken, Number(quizId), Number(attemptId), {
      ...(for_admin_review != null
        ? { for_admin_review: for_admin_review === "true" }
        : {}),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch quiz attempt";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


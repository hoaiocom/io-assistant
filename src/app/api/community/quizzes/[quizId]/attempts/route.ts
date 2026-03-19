import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { createQuizAttempt } from "@/lib/circle/headless-member";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { quizId } = await params;
    const body = await req.json().catch(() => ({}));

    const responses =
      body && Array.isArray(body.responses) ? (body.responses as unknown[]) : undefined;

    const safeResponses =
      responses
        ?.map((r) => {
          const rr = r as { question_id?: unknown; selected_options?: unknown };
          const question_id = typeof rr.question_id === "number" ? rr.question_id : null;
          const selected_options = Array.isArray(rr.selected_options)
            ? rr.selected_options.filter((x): x is number => typeof x === "number")
            : [];
          if (!question_id) return null;
          return { question_id, selected_options };
        })
        .filter(Boolean) || undefined;

    const data = await createQuizAttempt(session.accessToken, Number(quizId), {
      ...(safeResponses ? { responses: safeResponses } : {}),
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create quiz attempt";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


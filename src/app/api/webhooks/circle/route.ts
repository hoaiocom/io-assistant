import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[Circle Webhook]", JSON.stringify(body, null, 2));
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process webhook" },
      { status: 500 },
    );
  }
}

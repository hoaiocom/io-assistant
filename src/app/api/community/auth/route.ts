import { NextRequest, NextResponse } from "next/server";
import { getMemberSession, loginMember, logoutMember } from "@/lib/member-auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await loginMember(email);
    return NextResponse.json({
      success: true,
      community_member_id: result.community_member_id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function GET() {
  const session = await getMemberSession();
  return NextResponse.json({
    isLoggedIn: session.isLoggedIn || false,
    communityMemberId: session.communityMemberId,
  });
}

export async function DELETE() {
  await logoutMember();
  return NextResponse.json({ success: true });
}

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { createAuthToken, refreshAccessToken, revokeAccessToken } from "@/lib/circle/headless-auth";

export interface MemberSessionData {
  isLoggedIn: boolean;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  communityMemberId?: number;
  communityId?: number;
}

const memberSessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD || "fallback-dev-password-that-is-at-least-32-chars-long!!",
  cookieName: "io-community-member-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getMemberSession() {
  const cookieStore = await cookies();
  return getIronSession<MemberSessionData>(cookieStore, memberSessionOptions);
}

export async function requireMemberAuth(): Promise<MemberSessionData & { accessToken: string }> {
  const session = await getMemberSession();
  if (!session.isLoggedIn || !session.accessToken) {
    throw new Error("Unauthorized");
  }

  if (session.accessTokenExpiresAt && new Date(session.accessTokenExpiresAt) < new Date()) {
    if (session.refreshToken) {
      try {
        const refreshed = await refreshAccessToken(session.refreshToken);
        session.accessToken = refreshed.access_token;
        session.accessTokenExpiresAt = refreshed.access_token_expires_at;
        await session.save();
      } catch {
        session.destroy();
        throw new Error("Session expired");
      }
    } else {
      session.destroy();
      throw new Error("Session expired");
    }
  }

  return session as MemberSessionData & { accessToken: string };
}

export async function loginMember(email: string) {
  const authResult = await createAuthToken({ email });
  const session = await getMemberSession();

  session.isLoggedIn = true;
  session.accessToken = authResult.access_token;
  session.refreshToken = authResult.refresh_token;
  session.accessTokenExpiresAt = authResult.access_token_expires_at;
  session.refreshTokenExpiresAt = authResult.refresh_token_expires_at;
  session.communityMemberId = authResult.community_member_id;
  session.communityId = authResult.community_id;

  await session.save();
  return authResult;
}

export async function logoutMember() {
  const session = await getMemberSession();
  if (session.accessToken) {
    try {
      await revokeAccessToken(session.accessToken);
    } catch {
      // Best-effort revocation
    }
  }
  session.destroy();
}

import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { compare } from "bcryptjs";

export interface SessionData {
  isLoggedIn: boolean;
  username?: string;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD || "fallback-dev-password-that-is-at-least-32-chars-long!!",
  cookieName: "io-assistant-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return false;
  return compare(password, hash);
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    throw new Error("Unauthorized");
  }
  return session;
}

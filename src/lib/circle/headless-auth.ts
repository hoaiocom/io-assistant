const HEADLESS_BASE_URL = "https://app.circle.so/api/v1/headless";

interface HeadlessAuthToken {
  access_token: string;
  refresh_token: string;
  access_token_expires_at: string;
  refresh_token_expires_at: string;
  community_member_id: number;
  community_id: number;
}

interface RefreshedToken {
  access_token: string;
  access_token_expires_at: string;
}

function getHeadlessHeaders() {
  const token = process.env.CIRCLE_HEADLESS_AUTH_TOKEN;
  if (!token) {
    throw new Error("Missing CIRCLE_HEADLESS_AUTH_TOKEN environment variable");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function createAuthToken(
  identifier:
    | { email: string }
    | { community_member_id: number }
    | { sso_user_id: string },
): Promise<HeadlessAuthToken> {
  const res = await fetch(`${HEADLESS_BASE_URL}/auth_token`, {
    method: "POST",
    headers: getHeadlessHeaders(),
    body: JSON.stringify(identifier),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Headless auth failed: ${res.status} ${(err as { message?: string }).message || ""}`,
    );
  }

  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<RefreshedToken> {
  const res = await fetch(`${HEADLESS_BASE_URL}/access_token/refresh`, {
    method: "PATCH",
    headers: getHeadlessHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Token refresh failed: ${res.status} ${(err as { message?: string }).message || ""}`,
    );
  }

  return res.json();
}

export async function revokeAccessToken(accessToken: string): Promise<void> {
  await fetch(`${HEADLESS_BASE_URL}/access_token/revoke`, {
    method: "POST",
    headers: getHeadlessHeaders(),
    body: JSON.stringify({ access_token: accessToken }),
  });
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await fetch(`${HEADLESS_BASE_URL}/refresh_token/revoke`, {
    method: "POST",
    headers: getHeadlessHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

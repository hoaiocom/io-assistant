import type { PaginatedResponse, CircleErrorResponse } from "./types";

class CircleAPIError extends Error {
  constructor(
    public status: number,
    public body: CircleErrorResponse | string,
  ) {
    const msg =
      typeof body === "object" && body.message
        ? body.message
        : `Circle API error: ${status}`;
    super(msg);
    this.name = "CircleAPIError";
  }
}

// ---------------------------------------------------------------------------
// In-memory cache – avoids redundant Circle API calls for identical GET
// requests within a configurable TTL window.
// ---------------------------------------------------------------------------

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

const TTL = {
  LONG: 10 * 60 * 1000,  // 10 min – rarely-changing data (spaces, community, access-groups)
  MED: 5 * 60 * 1000,    // 5 min  – semi-dynamic data (member/post counts, leaderboard)
  SHORT: 2 * 60 * 1000,  // 2 min  – moderately dynamic data
} as const;

const PATH_TTL_MAP: [RegExp, number][] = [
  [/^spaces(\?|$)/, TTL.LONG],
  [/^space_groups(\?|$)/, TTL.LONG],
  [/^community$/, TTL.LONG],
  [/^access_groups(\?|$)/, TTL.LONG],
  [/^profile_fields(\?|$)/, TTL.LONG],
  [/^forms(\?|$)/, TTL.LONG],
  [/^courses\/sections/, TTL.LONG],
  [/^courses\/lessons/, TTL.LONG],
  [/^community_members\?.*per_page=1/, TTL.MED],
  [/^posts\?.*per_page=1/, TTL.MED],
  [/^gamification\/leaderboard/, TTL.MED],
  [/^community_members/, TTL.SHORT],
];

function getTtlForPath(path: string): number | null {
  for (const [pattern, ttl] of PATH_TTL_MAP) {
    if (pattern.test(path)) return ttl;
  }
  return null;
}

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(pathPrefix?: string): void {
  if (!pathPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(pathPrefix)) {
      cache.delete(key);
    }
  }
}

function invalidateCacheForMutation(path: string): void {
  const baseResource = path.split("/")[0].split("?")[0];
  invalidateCache(baseResource);
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 1800;

let requestLog: number[] = [];

function checkRateLimit() {
  const now = Date.now();
  requestLog = requestLog.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (requestLog.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestInWindow = requestLog[0];
    const waitMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow) + 1000;
    throw new Error(
      `Rate limit approaching (${requestLog.length} requests in 5min window). Retry in ${Math.ceil(waitMs / 1000)}s.`,
    );
  }
  requestLog.push(now);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

async function circleRequest<T>(
  path: string,
  options: RequestInit = {},
  retries = 3,
): Promise<T> {
  const token = process.env.CIRCLE_API_TOKEN;
  const host = process.env.CIRCLE_COMMUNITY_HOST;

  if (!token || !host) {
    throw new Error(
      "Missing CIRCLE_API_TOKEN or CIRCLE_COMMUNITY_HOST environment variables",
    );
  }

  const method = (options.method ?? "GET").toUpperCase();
  const normalizedPath = path.replace(/^\//, "");

  if (method === "GET") {
    const ttl = getTtlForPath(normalizedPath);
    if (ttl !== null) {
      const cached = getCached<T>(normalizedPath);
      if (cached !== undefined) return cached;
    }
  }

  checkRateLimit();

  const url = `https://app.circle.so/api/admin/v2/${normalizedPath}`;
  const headers: Record<string, string> = {
    Authorization: `Token ${token}`,
    host,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 429 && retries > 0) {
    const delay = Math.pow(2, 3 - retries) * 15000;
    await sleep(delay);
    return circleRequest<T>(path, options, retries - 1);
  }

  if (!res.ok) {
    let body: CircleErrorResponse | string;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new CircleAPIError(res.status, body);
  }

  if (res.status === 204) {
    if (method !== "GET") {
      invalidateCacheForMutation(normalizedPath);
    }
    return undefined as T;
  }

  const data: T = await res.json();

  if (method === "GET") {
    const ttl = getTtlForPath(normalizedPath);
    if (ttl !== null) {
      setCache(normalizedPath, data, ttl);
    }
  } else {
    invalidateCacheForMutation(normalizedPath);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const circleAdmin = {
  get<T>(path: string, params?: Record<string, string | number | boolean>) {
    const query = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== "")
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : "";
    return circleRequest<T>(`${path}${query}`);
  },

  post<T>(path: string, body?: unknown) {
    return circleRequest<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(path: string, body?: unknown) {
    return circleRequest<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown) {
    return circleRequest<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(path: string, params?: Record<string, string | number>) {
    const query = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ).toString()
      : "";
    return circleRequest<T>(`${path}${query}`, { method: "DELETE" });
  },

  async paginate<T>(
    path: string,
    params: Record<string, string | number | boolean> = {},
    maxPages = 50,
  ): Promise<T[]> {
    const allRecords: T[] = [];
    let page = 1;

    while (page <= maxPages) {
      const result = await this.get<PaginatedResponse<T>>(path, {
        ...params,
        page,
        per_page: 60,
      });
      allRecords.push(...result.records);

      if (!result.has_next_page) break;
      page++;
    }

    return allRecords;
  },
};

export { CircleAPIError };

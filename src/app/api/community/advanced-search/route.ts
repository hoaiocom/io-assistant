import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { advancedSearch, type AdvancedSearchType } from "@/lib/circle/headless-member";

type NormalizedSearchRecord = {
  id: number;
  record_type: string;
  name?: string;
  display_title?: string;
  body?: string;
  space_id?: number;
  space_name?: string;
  url?: string;
  post_id?: number;
  community_member?: {
    name: string;
    avatar_url?: string | null;
    community_member_id?: number;
  };
  user_name?: string;
};

function normalizeRecords(records: unknown[]): NormalizedSearchRecord[] {
  return records
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const rec = r as Record<string, unknown>;
      const type = typeof rec.type === "string" ? rec.type : "unknown";
      const id = typeof rec.id === "number" ? rec.id : null;
      if (!id) return null;

      if (type === "posts" || type === "post") {
        const space = (rec.space as Record<string, unknown> | undefined) || undefined;
        const author = (rec.author as Record<string, unknown> | undefined) || undefined;
        return {
          id,
          record_type: "post",
          display_title:
            (typeof rec.highlighted_name === "string" && rec.highlighted_name) ||
            (typeof rec.name === "string" ? rec.name : undefined),
          body:
            (typeof rec.highlighted_body === "string" && rec.highlighted_body) ||
            (typeof rec.body === "string" ? rec.body : undefined),
          space_id: typeof space?.id === "number" ? (space.id as number) : undefined,
          space_name: typeof space?.name === "string" ? (space.name as string) : undefined,
          url: typeof rec.url === "string" ? (rec.url as string) : undefined,
          community_member: author
            ? {
                name: typeof author.name === "string" ? (author.name as string) : "Unknown",
                avatar_url:
                  typeof author.avatar_url === "string" ? (author.avatar_url as string) : null,
                community_member_id:
                  typeof author.community_member_id === "number"
                    ? (author.community_member_id as number)
                    : undefined,
              }
            : undefined,
        };
      }

      if (type === "comments" || type === "comment") {
        const author = (rec.author as Record<string, unknown> | undefined) || undefined;
        return {
          id,
          record_type: "comment",
          display_title: typeof rec.post_name === "string" ? (rec.post_name as string) : "Comment",
          body:
            (typeof rec.highlighted_body === "string" && rec.highlighted_body) ||
            (typeof rec.body === "string" ? (rec.body as string) : undefined),
          space_id: typeof rec.space_id === "number" ? (rec.space_id as number) : undefined,
          post_id: typeof rec.post_id === "number" ? (rec.post_id as number) : undefined,
          // Swagger provides `space_slug` for comments; use it as a display fallback.
          space_name: typeof rec.space_slug === "string" ? (rec.space_slug as string) : undefined,
          url: typeof rec.url === "string" ? (rec.url as string) : undefined,
          community_member: author
            ? {
                name: typeof author.name === "string" ? (author.name as string) : "Unknown",
                avatar_url:
                  typeof author.avatar_url === "string" ? (author.avatar_url as string) : null,
                community_member_id:
                  typeof author.community_member_id === "number"
                    ? (author.community_member_id as number)
                    : undefined,
              }
            : undefined,
        };
      }

      if (type === "spaces" || type === "space") {
        return {
          id,
          record_type: "space",
          display_title:
            (typeof rec.highlighted_name === "string" && rec.highlighted_name) ||
            (typeof rec.name === "string" ? (rec.name as string) : undefined),
          name: typeof rec.name === "string" ? (rec.name as string) : undefined,
        };
      }

      if (type === "lessons" || type === "lesson") {
        const space = (rec.space as Record<string, unknown> | undefined) || undefined;
        return {
          id,
          record_type: "lesson",
          display_title:
            (typeof rec.highlighted_name === "string" && rec.highlighted_name) ||
            (typeof rec.name === "string" ? (rec.name as string) : undefined),
          body:
            (typeof rec.highlighted_body === "string" && rec.highlighted_body) ||
            (typeof rec.body === "string" ? (rec.body as string) : undefined),
          space_id: typeof space?.id === "number" ? (space.id as number) : undefined,
          space_name: typeof space?.name === "string" ? (space.name as string) : undefined,
        };
      }

      if (type === "members" || type === "community_member") {
        return {
          id,
          record_type: "member",
          display_title:
            (typeof rec.highlighted_name === "string" && rec.highlighted_name) ||
            (typeof rec.name === "string" ? (rec.name as string) : undefined),
          name: typeof rec.name === "string" ? (rec.name as string) : undefined,
          body: typeof rec.headline === "string" ? (rec.headline as string) : undefined,
          community_member: {
            name: typeof rec.name === "string" ? (rec.name as string) : "Unknown",
            avatar_url: typeof rec.avatar_url === "string" ? (rec.avatar_url as string) : null,
            community_member_id: id,
          },
        };
      }

      if (type === "mentions" || type === "group_mention") {
        return {
          id,
          record_type: "mention",
          display_title:
            (typeof rec.highlighted_name === "string" && rec.highlighted_name) ||
            (typeof rec.name === "string" ? (rec.name as string) : undefined),
        };
      }

      return {
        id,
        record_type: String(type),
        display_title: typeof rec.name === "string" ? (rec.name as string) : undefined,
      };
    })
    .filter(Boolean) as NormalizedSearchRecord[];
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireMemberAuth();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = Number(searchParams.get("page")) || 1;
    const per_page = Number(searchParams.get("per_page")) || 20;
    const type = (searchParams.get("type") || undefined) as AdvancedSearchType | undefined;

    if (!q) {
      return NextResponse.json({ records: [], count: 0, page, per_page, has_next_page: false });
    }

    const raw = (await advancedSearch(session.accessToken, {
      query: q,
      page,
      per_page,
      type,
    })) as Record<string, unknown>;

    const records = Array.isArray(raw.records) ? normalizeRecords(raw.records) : [];
    return NextResponse.json({
      ...raw,
      records,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Advanced search failed";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


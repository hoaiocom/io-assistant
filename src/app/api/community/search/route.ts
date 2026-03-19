import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { searchContent } from "@/lib/circle/headless-member";

type BasicSearchRecord = {
  id: number;
  record_type: string;
  name?: string;
  display_title?: string;
  highlighted_name?: string;
  body?: string;
  highlighted_body?: string;
  space_id?: number;
  space_name?: string;
  post_id?: number;
  community_member?: {
    name: string;
    avatar_url?: string | null;
    community_member_id?: number;
  };
  user_name?: string;
};

function normalizeRecords(records: unknown[]): BasicSearchRecord[] {
  return records
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const rec = r as Record<string, unknown>;
      const type = typeof rec.type === "string" ? rec.type : "";
      const attributes = (rec.attributes as Record<string, unknown> | undefined) || {};

      // Posts
      if (type === "post") {
        const space = (attributes.space as Record<string, unknown> | undefined) || undefined;
        const author = (attributes.author as Record<string, unknown> | undefined) || undefined;
        const name =
          (typeof attributes.name === "string" && attributes.name) ||
          (typeof attributes.highlighted_post_name === "string" &&
            attributes.highlighted_post_name) ||
          (typeof attributes.highlighted_name === "string" && attributes.highlighted_name) ||
          undefined;

        const body =
          (typeof attributes.highlighted_body === "string" && attributes.highlighted_body) ||
          (typeof attributes.body === "string" && attributes.body) ||
          undefined;

        const id =
          typeof attributes.id === "number"
            ? attributes.id
            : typeof attributes.id === "string"
              ? Number(attributes.id)
              : null;
        if (!id) return null;

        return {
          id,
          record_type: "post",
          name,
          display_title: name,
          highlighted_name:
            typeof attributes.highlighted_name === "string"
              ? (attributes.highlighted_name as string)
              : undefined,
          body,
          highlighted_body:
            typeof attributes.highlighted_body === "string"
              ? (attributes.highlighted_body as string)
              : undefined,
          space_id:
            typeof space?.id === "number"
              ? (space.id as number)
              : typeof space?.id === "string"
                ? Number(space.id)
                : undefined,
          space_name:
            typeof space?.name === "string" ? (space.name as string) : undefined,
          community_member: author
            ? {
                name:
                  typeof author.name === "string"
                    ? (author.name as string)
                    : "Unknown",
                avatar_url:
                  typeof author.avatar_url === "string"
                    ? (author.avatar_url as string)
                    : null,
                community_member_id:
                  typeof author.community_member_id === "number"
                    ? (author.community_member_id as number)
                    : undefined,
              }
            : undefined,
        };
      }

      // Community members
      if (type === "community_member") {
        const idValue = attributes.id ?? attributes.community_member_id;
        const id =
          typeof idValue === "number"
            ? idValue
            : typeof idValue === "string"
              ? Number(idValue)
              : null;
        if (!id) return null;

        return {
          id,
          record_type: "member",
          name: typeof attributes.name === "string" ? (attributes.name as string) : undefined,
          display_title:
            (typeof attributes.highlighted_name === "string" &&
              (attributes.highlighted_name as string)) ||
            (typeof attributes.name === "string" ? (attributes.name as string) : undefined),
          highlighted_name:
            typeof attributes.highlighted_name === "string"
              ? (attributes.highlighted_name as string)
              : undefined,
          body:
            typeof attributes.headline === "string"
              ? (attributes.headline as string)
              : undefined,
          community_member: {
            name:
              typeof attributes.name === "string"
                ? (attributes.name as string)
                : "Unknown",
            avatar_url:
              typeof attributes.avatar_url === "string"
                ? (attributes.avatar_url as string)
                : null,
            community_member_id:
              typeof attributes.community_member_id === "number"
                ? (attributes.community_member_id as number)
                : undefined,
          },
        };
      }

      // Spaces
      if (type === "space") {
        const id =
          typeof attributes.id === "number"
            ? attributes.id
            : typeof attributes.id === "string"
              ? Number(attributes.id)
              : null;
        if (!id) return null;

        return {
          id,
          record_type: "space",
          name: typeof attributes.name === "string" ? (attributes.name as string) : undefined,
          display_title:
            (typeof attributes.highlighted_name === "string" &&
              (attributes.highlighted_name as string)) ||
            (typeof attributes.name === "string" ? (attributes.name as string) : undefined),
          highlighted_name:
            typeof attributes.highlighted_name === "string"
              ? (attributes.highlighted_name as string)
              : undefined,
        };
      }

      return null;
    })
    .filter(Boolean) as BasicSearchRecord[];
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireMemberAuth();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = Number(searchParams.get("page")) || 1;
    const per_page = Number(searchParams.get("per_page")) || 20;

    if (!q) {
      return NextResponse.json({ records: [], count: 0 });
    }

    const data = (await searchContent(session.accessToken, q, {
      page,
      per_page,
    })) as Record<string, unknown>;

    const normalized = Array.isArray(data.records)
      ? normalizeRecords(data.records)
      : [];

    return NextResponse.json({
      ...data,
      records: normalized,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

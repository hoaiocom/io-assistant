import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { addTagToMember, removeTagFromMember } from "@/lib/circle/members";
import { addSpaceMember } from "@/lib/circle/spaces";
import { addMemberToAccessGroup } from "@/lib/circle/admin-extras";
import { getMember } from "@/lib/circle/members";

export async function POST(request: Request) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, member_ids, tag_id, space_id, access_group_id } = body as {
      action: string;
      member_ids: number[];
      tag_id?: number;
      space_id?: number;
      access_group_id?: number;
    };

    if (!action || !member_ids?.length) {
      return NextResponse.json(
        { error: "action and member_ids are required" },
        { status: 400 },
      );
    }

    const results: { member_id: number; success: boolean; error?: string }[] = [];

    for (const member_id of member_ids) {
      try {
        switch (action) {
          case "add_tag": {
            if (!tag_id) throw new Error("tag_id is required for add_tag");
            await addTagToMember({ member_tag_id: tag_id, community_member_id: member_id });
            break;
          }
          case "remove_tag": {
            if (!tag_id) throw new Error("tag_id is required for remove_tag");
            await removeTagFromMember(tag_id);
            break;
          }
          case "add_to_space": {
            if (!space_id) throw new Error("space_id is required for add_to_space");
            const member = await getMember(member_id);
            await addSpaceMember({ space_id, email: member.email });
            break;
          }
          case "add_to_access_group": {
            if (!access_group_id) throw new Error("access_group_id is required for add_to_access_group");
            const m = await getMember(member_id);
            await addMemberToAccessGroup(access_group_id, m.email);
            break;
          }
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.push({ member_id, success: true });
      } catch (error) {
        results.push({
          member_id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk operation failed" },
      { status: 500 },
    );
  }
}

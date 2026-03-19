import { NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getChatRoom } from "@/lib/circle/headless-member";

/* eslint-disable @typescript-eslint/no-explicit-any */

function normalizeChatRoom(raw: any): any {
  const room = raw?.chat_room || raw;
  if (!room) return raw;

  const participants = room.other_participants_preview || room.participants || room.community_members || [];
  const currentParticipant = room.current_participant || null;

  return {
    id: room.id,
    uuid: room.uuid,
    identifier: room.identifier,
    kind: room.chat_room_kind || room.kind,
    name: room.chat_room_name || room.name || null,
    unread_count: room.unread_messages_count ?? room.unread_count ?? 0,
    participants_count: room.chat_room_participants_count || participants.length,
    participants: participants.map((p: any) => ({
      id: p.id,
      name: p.name,
      avatar_url: p.avatar_url || null,
      community_member_id: p.community_member_id,
      headline: p.headline || null,
      bio: p.bio || null,
      status: p.status || null,
      email: p.email || null,
      admin: p.admin || false,
      moderator: p.moderator || false,
    })),
    current_participant: currentParticipant
      ? {
          id: currentParticipant.id,
          name: currentParticipant.name,
          avatar_url: currentParticipant.avatar_url || null,
          community_member_id: currentParticipant.community_member_id,
        }
      : null,
    last_message: room.last_message || null,
    updated_at: room.last_message?.created_at || room.updated_at || room.created_at,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uuid: string }> },
) {
  try {
    const session = await requireMemberAuth();
    const { uuid } = await params;
    const data = await getChatRoom(session.accessToken, uuid);
    return NextResponse.json(normalizeChatRoom(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch chat room";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

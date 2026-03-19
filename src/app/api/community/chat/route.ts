import { NextRequest, NextResponse } from "next/server";
import { requireMemberAuth } from "@/lib/member-auth";
import { getChatRooms, createChatRoom } from "@/lib/circle/headless-member";

/* eslint-disable @typescript-eslint/no-explicit-any */

function normalizeChatRoom(raw: any): any {
  const room = raw?.chat_room || raw;
  if (!room) return raw;

  const participants = room.other_participants_preview || room.participants || room.community_members || [];
  const currentParticipant = room.current_participant || null;
  const lastMsg = room.last_message;

  let lastMessageNormalized = null;
  if (lastMsg) {
    const senderId = lastMsg.chat_room_participant_id;
    let senderName: string | undefined;
    let senderAvatar: string | undefined;

    if (lastMsg.sender) {
      senderName = lastMsg.sender.name;
      senderAvatar = lastMsg.sender.avatar_url;
    } else if (senderId) {
      const matchedParticipant =
        participants.find((p: any) => p.id === senderId) ||
        (currentParticipant?.id === senderId ? currentParticipant : null);
      if (matchedParticipant) {
        senderName = matchedParticipant.name;
        senderAvatar = matchedParticipant.avatar_url;
      }
    }

    lastMessageNormalized = {
      id: lastMsg.id,
      body: lastMsg.body,
      rich_text_body: lastMsg.rich_text_body,
      created_at: lastMsg.created_at || lastMsg.sent_at,
      sender_name: senderName,
      sender_avatar_url: senderAvatar || null,
    };
  }

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
      status: p.status || null,
      email: p.email || null,
    })),
    current_participant: currentParticipant
      ? {
          id: currentParticipant.id,
          name: currentParticipant.name,
          avatar_url: currentParticipant.avatar_url || null,
          community_member_id: currentParticipant.community_member_id,
        }
      : null,
    last_message: lastMessageNormalized,
    first_unread_message_id: room.first_unread_message_id || null,
    updated_at: lastMsg?.created_at || room.updated_at || room.created_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireMemberAuth();
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const per_page = Number(searchParams.get("per_page")) || 20;

    const data = await getChatRooms(session.accessToken, { page, per_page }) as any;

    const records = Array.isArray(data?.records)
      ? data.records.map(normalizeChatRoom)
      : Array.isArray(data) ? data.map(normalizeChatRoom) : [];

    return NextResponse.json({
      page: data?.page || page,
      per_page: data?.per_page || per_page,
      has_next_page: data?.has_next_page || false,
      count: data?.count || records.length,
      records,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch chats";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireMemberAuth();
    const body = await req.json();
    const data = await createChatRoom(session.accessToken, body) as any;
    return NextResponse.json(normalizeChatRoom(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create chat";
    if (message === "Unauthorized" || message === "Session expired") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Plus, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ChatRoom {
  id: number;
  uuid: string;
  name?: string;
  last_message?: {
    body?: string;
    rich_text_body?: Record<string, unknown>;
    created_at: string;
    sender_name?: string;
  };
  participants?: Array<{
    id: number;
    name: string;
    avatar_url?: string | null;
  }>;
  unread_count?: number;
  updated_at: string;
}

export default function ChatPage() {
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");

  const { data, isLoading } = useSWR(
    `/api/community/chat?page=${page}&per_page=30`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const chatRooms: ChatRoom[] = data?.records || [];

  const filteredRooms = searchText
    ? chatRooms.filter(
        (room) =>
          room.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          room.participants?.some((p) =>
            p.name.toLowerCase().includes(searchText.toLowerCase()),
          ),
      )
    : chatRooms;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Chat</h1>
      </div>

      {chatRooms.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            {searchText
              ? `No conversations matching "${searchText}"`
              : "No conversations yet. Start a chat with another member!"}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredRooms.map((room) => {
            const otherParticipants = room.participants?.slice(0, 3) || [];
            const roomName =
              room.name ||
              otherParticipants.map((p) => p.name).join(", ") ||
              "Chat";
            const firstAvatar = otherParticipants[0]?.avatar_url;
            const firstInitials = (otherParticipants[0]?.name || roomName || "?")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const lastMessage = room.last_message;
            const rawDate = lastMessage?.created_at || room.updated_at;
            const parsed = rawDate ? new Date(rawDate) : null;
            const timeAgo =
              parsed && !isNaN(parsed.getTime())
                ? formatDistanceToNow(parsed, { addSuffix: true })
                : "";

            return (
              <Link
                key={room.uuid || room.id}
                href={`/community/chat/${room.uuid || room.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                  room.unread_count && room.unread_count > 0 && "bg-primary/[0.03] border-primary/20",
                )}
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={firstAvatar || undefined} />
                  <AvatarFallback className="text-xs">{firstInitials}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{roomName}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo}
                    </span>
                  </div>
                  {typeof lastMessage?.body === "string" && lastMessage.body && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {lastMessage.sender_name && (
                        <span className="font-medium">{lastMessage.sender_name}: </span>
                      )}
                      {lastMessage.body.replace(/<[^>]*>/g, "")}
                    </p>
                  )}
                </div>

                {room.unread_count != null && room.unread_count > 0 && (
                  <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {room.unread_count}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

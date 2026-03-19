"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ChatMessage {
  id: number;
  body?: string;
  rich_text_body?: Record<string, unknown>;
  created_at: string;
  community_member?: {
    id: number;
    name: string;
    avatar_url?: string | null;
  };
  sender_name?: string;
  sender_avatar_url?: string | null;
}

export default function ChatRoomPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: room } = useSWR(
    `/api/community/chat/${uuid}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: messagesData, isLoading, mutate } = useSWR(
    `/api/community/chat/${uuid}/messages?per_page=50`,
    fetcher,
    { refreshInterval: 5000 },
  );

  const messages: ChatMessage[] = messagesData?.records || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/community/chat/${uuid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rich_text_body: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: messageText }],
              },
            ],
          },
        }),
      });
      setMessageText("");
      mutate();
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const roomName =
    room?.name ||
    room?.participants?.map((p: { name: string }) => p.name).join(", ") ||
    "Chat";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link
          href="/community/chat"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-sm font-semibold">{roomName}</h1>
          {room?.participants && (
            <p className="text-xs text-muted-foreground">
              {room.participants.length} members
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-48 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const sender = msg.community_member;
            const name = sender?.name || msg.sender_name || "Unknown";
            const avatar = sender?.avatar_url || msg.sender_avatar_url;
            const initials = name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const body = msg.body || "";
            const timeAgo = formatDistanceToNow(new Date(msg.created_at), {
              addSuffix: true,
            });

            return (
              <div key={msg.id} className="flex gap-2.5">
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={avatar || undefined} />
                  <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{name}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                  </div>
                  <div
                    className="mt-0.5 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: body }}
                  />
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t px-4 py-3"
      >
        <input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || !messageText.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

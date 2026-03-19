"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  isToday,
  isYesterday,
  format,
  isSameDay,
  formatDistanceToNow,
} from "date-fns";
import {
  ArrowLeft,
  Send,
  Smile,
  Paperclip,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CornerUpLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { renderTiptapToHtml } from "@/lib/tiptap-renderer";
import { RichText } from "@/components/community/RichText";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const EMOJI_MAP: Record<string, string> = {
  thumbsup: "👍",
  heart: "❤️",
  joy: "😂",
  open_mouth: "😮",
  cry: "😢",
  pray: "🙏",
  tada: "🎉",
};

const QUICK_REACTIONS = ["heart", "thumbsup", "joy", "pray", "tada"];

interface Reaction {
  emoji: string;
  count: number;
  community_member_ids?: number[];
}

interface ChatMessage {
  id: number;
  body?: string;
  rich_text_body?: Record<string, unknown>;
  created_at: string;
  sent_at?: string;
  edited_at?: string | null;
  sender?: {
    id: number;
    name: string;
    community_member_id: number;
    avatar_url?: string | null;
    user_public_uid?: string;
  };
  community_member?: {
    id: number;
    name: string;
    avatar_url?: string | null;
  };
  sender_name?: string;
  sender_avatar_url?: string | null;
  reactions?: Reaction[];
  replies_count?: number;
  chat_thread_replies_count?: number;
  chat_thread_id?: number;
  total_thread_participants_count?: number;
  thread_participant_avatar_urls?: string[];
  thread_participants_preview?: Array<{
    id: number;
    community_member_id: number;
    avatar_url?: string | null;
    name: string;
  }>;
  parent_message_id?: number | null;
  last_reply_at?: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function safeAvatarUrl(url?: string | null): string | undefined {
  if (!url || url.trim() === "") return undefined;
  return url;
}

function normalizeTiptapBody(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  // Circle sometimes returns the TipTap wrapper: { body: { type: 'doc', ... } }
  if ("body" in (input as Record<string, unknown>)) return input;
  // Other times we may get the raw doc node: { type: 'doc', ... }
  if ("type" in (input as Record<string, unknown>)) return { body: input };
  return input;
}

function renderRichTextHtml(richTextBody: unknown): string {
  // Keep for a couple spots that want HTML string; RichText is preferred.
  const normalized = normalizeTiptapBody(richTextBody);
  return renderTiptapToHtml(normalized);
}

function formatDateDivider(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  // Space chat uses compact date separator; keep DM consistent with that.
  return format(d, "MMM dd").toUpperCase();
}

function formatMessageTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    if (isToday(d)) return format(d, "hh:mm a");
    if (isYesterday(d)) return `Yesterday at ${format(d, "hh:mm a")}`;
    return `${format(d, "MMM d")} at ${format(d, "hh:mm a")}`;
  } catch {
    return "";
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

function shouldShowDateDivider(
  messages: ChatMessage[],
  index: number,
): boolean {
  if (index === 0) return true;
  const curr = new Date(messages[index].created_at);
  const prev = new Date(messages[index - 1].created_at);
  return !isSameDay(curr, prev);
}

function shouldGroupWithPrevious(
  messages: ChatMessage[],
  index: number,
): boolean {
  if (index === 0) return false;
  const curr = messages[index];
  const prev = messages[index - 1];
  const currSenderId =
    curr.sender?.community_member_id || curr.community_member?.id;
  const prevSenderId =
    prev.sender?.community_member_id || prev.community_member?.id;
  if (!currSenderId || !prevSenderId || currSenderId !== prevSenderId)
    return false;
  const currTime = new Date(curr.created_at).getTime();
  const prevTime = new Date(prev.created_at).getTime();
  return currTime - prevTime < 5 * 60 * 1000;
}

function ReactionBadge({
  reaction,
  currentMemberId,
  onToggle,
}: {
  reaction: Reaction;
  currentMemberId?: number;
  onToggle: (emoji: string) => void;
}) {
  const isActive =
    currentMemberId &&
    reaction.community_member_ids?.includes(currentMemberId);
  const emoji = EMOJI_MAP[reaction.emoji] || reaction.emoji;

  return (
    <button
      onClick={() => onToggle(reaction.emoji)}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
        isActive
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-muted/50 text-foreground/80 hover:bg-muted",
      )}
    >
      <span className="text-sm leading-none">{emoji}</span>
      <span className="font-medium">{reaction.count}</span>
    </button>
  );
}

function ThreadPanel({
  chatRoomUuid,
  parentMessage,
  localReplies,
  totalReplies,
}: {
  chatRoomUuid: string;
  parentMessage: ChatMessage;
  localReplies: ChatMessage[];
  totalReplies: number;
}) {
  const [fetchedReplies, setFetchedReplies] = useState<ChatMessage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(false);

    // Preferred for DM: message-detail endpoint (includes replies in many cases).
    fetch(`/api/community/chat/${chatRoomUuid}/messages/${parentMessage.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.replies)) {
          setFetchedReplies(data.replies);
          return;
        }

        const threadId = parentMessage.chat_thread_id;
        if (!threadId) {
          setFetchedReplies(localReplies.length > 0 ? localReplies : []);
          return;
        }

        // Fallback matches Space chat behavior.
        return fetch(`/api/community/chat-threads/${threadId}`)
          .then((res) => res.json())
          .then((thread) => {
            if (cancelled) return;
            if (Array.isArray(thread?.replies)) setFetchedReplies(thread.replies);
            else setFetchedReplies(localReplies.length > 0 ? localReplies : []);
          });
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError(true);
          setFetchedReplies(localReplies.length > 0 ? localReplies : []);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRoomUuid, parentMessage.id, parentMessage.chat_thread_id]);

  const replies = (fetchedReplies ?? localReplies).filter((r) => {
    if (!r) return false;
    // Some Circle responses include the parent message in `replies`.
    if (r.id === parentMessage.id) return false;
    // Only keep actual replies to this parent when possible.
    if (r.parent_message_id != null) return r.parent_message_id === parentMessage.id;
    return true;
  });
  const replyCount = replies.length;

  return (
    <div className="ml-12 mt-2 rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-sm font-semibold">Replies</span>
        <span className="text-xs text-muted-foreground">
          {replyCount} {replyCount === 1 ? "reply" : "replies"}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center px-4 py-4">
          <Skeleton className="h-4 w-4 rounded-full" />
          <span className="ml-2 text-xs text-muted-foreground">Loading replies…</span>
        </div>
      ) : fetchError && replies.length === 0 ? (
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">Failed to load replies</p>
        </div>
      ) : replies.length > 0 ? (
        <div className="divide-y">
          {replies.map((reply) => {
            const sender = reply.sender || reply.community_member;
            const name = sender?.name || reply.sender_name || "Unknown";
            const avatar = sender?.avatar_url || reply.sender_avatar_url;
            const body = typeof reply.body === "string" ? reply.body : null;

            return (
              <div key={reply.id} className="flex gap-2.5 px-4 py-3">
                <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                  <AvatarImage src={safeAvatarUrl(avatar)} />
                  <AvatarFallback className="text-[9px]">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatMessageTime(reply.sent_at || reply.created_at)}
                    </span>
                  </div>
                  <div className="mt-0.5">
                    <RichText
                      tiptap={reply.rich_text_body}
                      html={body}
                      text={body}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            No replies yet
          </p>
        </div>
      )}
    </div>
  );
}

function MessageItem({
  msg,
  messages,
  index,
  currentMemberId,
  chatRoomUuid,
  mutateMessages,
  expandedThreadId,
  onToggleThread,
  onReply,
}: {
  msg: ChatMessage;
  messages: ChatMessage[];
  index: number;
  currentMemberId?: number;
  chatRoomUuid: string;
  mutateMessages: () => void;
  expandedThreadId: number | null;
  onToggleThread: (messageId: number, threadId: number | null) => void;
  onReply: (message: ChatMessage) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const grouped = shouldGroupWithPrevious(messages, index);

  const sender = msg.sender || msg.community_member;
  const name = sender?.name || msg.sender_name || "Unknown";
  const avatar = sender?.avatar_url || msg.sender_avatar_url;
  const initials = getInitials(name);

  const bodyText = typeof msg.body === "string" ? msg.body : null;
  const time = formatMessageTime(msg.sent_at || msg.created_at);

  const replyCount =
    msg.replies_count || msg.chat_thread_replies_count || 0;
  const threadAvatars = msg.thread_participant_avatar_urls || [];
  const threadPreview = msg.thread_participants_preview || [];
  const reactions = (msg.reactions || []).filter((r) => r.count > 0);
  const threadId = msg.chat_thread_id;
  const isThreadExpanded = expandedThreadId === msg.id;
  const lastReplyTime = msg.last_reply_at;

  async function handleReaction(emoji: string) {
    const existingReaction = reactions.find((r) => r.emoji === emoji);
    const isActive =
      currentMemberId &&
      existingReaction?.community_member_ids?.includes(currentMemberId);

    try {
      await fetch("/api/community/reactions", {
        method: isActive ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_room_message: msg.id, emoji }),
      });
      mutateMessages();
    } catch {
      toast.error("Failed to update reaction");
    }
  }

  return (
    <>
      <div
        className={cn("group relative px-4", grouped ? "mt-0.5" : "mt-4")}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {showActions && (
          <div className="absolute -top-3 right-4 z-10 flex items-center gap-0.5 rounded-lg border bg-card p-0.5 shadow-sm">
            <TooltipProvider delayDuration={200}>
              {QUICK_REACTIONS.slice(0, 4).map((emoji) => (
                <Tooltip key={emoji}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleReaction(emoji)}
                      className="rounded-md p-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      {EMOJI_MAP[emoji]}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {emoji}
                  </TooltipContent>
                </Tooltip>
              ))}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted">
                    <Smile className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Add reaction
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onReply(msg)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <CornerUpLeft className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Reply
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <div className="flex gap-2.5">
          {grouped ? (
            <div className="w-8 shrink-0" />
          ) : (
            <Avatar className="mt-0.5 h-8 w-8 shrink-0">
              <AvatarImage src={safeAvatarUrl(avatar)} />
              <AvatarFallback className="text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="min-w-0 flex-1">
            {!grouped && (
              <div className="mb-0.5 flex items-baseline gap-2">
                <span className="text-sm font-semibold">{name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {time}
                </span>
                {msg.edited_at && (
                  <span className="text-[10px] text-muted-foreground">
                    (edited)
                  </span>
                )}
              </div>
            )}

            <RichText
              tiptap={msg.rich_text_body}
              html={bodyText}
              text={bodyText}
            />

            {reactions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {reactions.map((reaction) => (
                  <ReactionBadge
                    key={reaction.emoji}
                    reaction={reaction}
                    currentMemberId={currentMemberId}
                    onToggle={handleReaction}
                  />
                ))}
              </div>
            )}

            {replyCount > 0 && (
              <button
                className="mt-1.5 flex items-center gap-2 rounded-md px-1 py-0.5 text-xs text-primary transition-colors hover:bg-primary/5"
                onClick={() =>
                  onToggleThread(msg.id, threadId ?? null)
                }
              >
                <div className="flex -space-x-1.5">
                  {(threadPreview.length > 0
                    ? threadPreview.slice(0, 3).map((p) => (
                        <Avatar
                          key={p.id}
                          className="h-4 w-4 border border-background"
                        >
                          <AvatarImage
                            src={safeAvatarUrl(p.avatar_url)}
                          />
                          <AvatarFallback className="text-[6px]">
                            {p.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      ))
                    : threadAvatars.slice(0, 3).map((url, i) => (
                        <Avatar
                          key={i}
                          className="h-4 w-4 border border-background"
                        >
                          <AvatarImage src={safeAvatarUrl(url)} />
                          <AvatarFallback className="text-[6px]">
                            ?
                          </AvatarFallback>
                        </Avatar>
                      ))
                  )}
                </div>
                <span className="font-medium">
                  {replyCount}{" "}
                  {replyCount === 1 ? "reply" : "replies"}
                </span>
                {lastReplyTime && (
                  <span className="text-muted-foreground">
                    {formatRelativeTime(lastReplyTime)}
                  </span>
                )}
                {isThreadExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ChatRoomPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedThreadId, setExpandedThreadId] = useState<number | null>(
    null,
  );
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: room } = useSWR(`/api/community/chat/${uuid}`, fetcher, {
    revalidateOnFocus: false,
  });

  const { data: authData } = useSWR("/api/community/auth", fetcher, {
    revalidateOnFocus: false,
  });
  const currentMemberId = authData?.communityMemberId;

  const {
    data: messagesData,
    isLoading,
    mutate,
  } = useSWR(
    `/api/community/chat/${uuid}/messages?per_page=50`,
    fetcher,
    { refreshInterval: 5000 },
  );

  const allRawMessages: ChatMessage[] = useMemo(() => {
    const msgs = messagesData?.records || [];
    return Array.isArray(msgs) ? msgs : [];
  }, [messagesData]);

  // Build reply map: parentId -> sorted replies (Space chat behavior)
  const replyMap = useMemo(() => {
    const map = new Map<number, ChatMessage[]>();
    for (const m of allRawMessages) {
      if (m.parent_message_id != null) {
        const existing = map.get(m.parent_message_id) || [];
        existing.push(m);
        map.set(m.parent_message_id, existing);
      }
    }
    for (const [key, replies] of map) {
      map.set(
        key,
        replies.sort(
          (a, b) =>
            new Date(a.sent_at || a.created_at).getTime() -
            new Date(b.sent_at || b.created_at).getTime(),
        ),
      );
    }
    return map;
  }, [allRawMessages]);

  // Top-level messages only (exclude replies), sorted chronologically
  const topLevelMessages: ChatMessage[] = useMemo(() => {
    return allRawMessages
      .filter((m) => m.parent_message_id == null)
      .sort(
        (a, b) =>
          new Date(a.sent_at || a.created_at).getTime() -
          new Date(b.sent_at || b.created_at).getTime(),
      );
  }, [allRawMessages]);

  useEffect(() => {
    if (uuid) {
      fetch(`/api/community/chat/${uuid}/read`, {
        method: "POST",
      }).catch(() => {});
    }
  }, [uuid]);

  useEffect(() => {
    if (topLevelMessages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCount.current = topLevelMessages.length;
  }, [topLevelMessages.length]);

  const handleTextareaInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  function handleToggleThread(
    messageId: number,
    _threadId: number | null,
  ) {
    setExpandedThreadId((prev) =>
      prev === messageId ? null : messageId,
    );
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSending(true);
    try {
      await fetch(`/api/community/chat/${uuid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(replyToId ? { parent_message_id: replyToId } : {}),
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
      setReplyToId(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      mutate();
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  const roomName = useMemo(() => {
    if (!room) return "Chat";
    const currentCmId = room.current_participant?.community_member_id;
    const participants = room.participants || [];
    const others = currentCmId
      ? participants.filter(
          (p: { community_member_id?: number; id: number }) =>
            p.community_member_id
              ? p.community_member_id !== currentCmId
              : p.id !== currentMemberId,
        )
      : participants;
    const display = others.length > 0 ? others : participants;
    return (
      room.name ||
      display
        .map((p: { name: string }) => p.name)
        .join(", ") ||
      "Chat"
    );
  }, [room, currentMemberId]);

  const participantCount = useMemo(() => {
    if (!room) return 0;
    return room.participants_count || room.participants?.length || 0;
  }, [room]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 items-center gap-3 border-b bg-card px-4 py-3">
        <Link
          href="/community/chat"
          className="text-muted-foreground hover:text-foreground md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{roomName}</h1>
          {participantCount > 0 && (
            <p className="text-[11px] text-muted-foreground">
              {participantCount}{" "}
              {participantCount === 1 ? "member" : "members"}
            </p>
          )}
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto py-2"
      >
        {isLoading ? (
          <div className="space-y-6 px-4 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-2.5">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : topLevelMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="px-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Send a message to start the conversation
              </p>
            </div>
          </div>
        ) : (
          <>
            {topLevelMessages.map((msg, index) => {
              const showDivider = shouldShowDateDivider(
                topLevelMessages,
                index,
              );

              return (
                <div key={msg.id}>
                  {showDivider && (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 border-t" />
                      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {formatDateDivider(msg.created_at)}
                      </span>
                      <div className="flex-1 border-t" />
                    </div>
                  )}
                  <MessageItem
                    msg={msg}
                    messages={topLevelMessages}
                    index={index}
                    currentMemberId={currentMemberId}
                    chatRoomUuid={uuid}
                    mutateMessages={mutate}
                    expandedThreadId={expandedThreadId}
                    onToggleThread={handleToggleThread}
                    onReply={(m) => {
                      setExpandedThreadId(m.id);
                      setReplyToId(m.id);
                      requestAnimationFrame(() => textareaRef.current?.focus());
                    }}
                  />
                  {expandedThreadId === msg.id &&
                    (msg.replies_count || msg.chat_thread_replies_count || 0) > 0 && (
                      <ThreadPanel
                        chatRoomUuid={uuid}
                        parentMessage={msg}
                        localReplies={replyMap.get(msg.id) || []}
                        totalReplies={
                          msg.replies_count ||
                          msg.chat_thread_replies_count ||
                          (replyMap.get(msg.id) || []).length
                        }
                      />
                    )}
                </div>
              );
            })}
            <div ref={messagesEndRef} className="h-2" />
          </>
        )}
      </div>

      <div className="shrink-0 border-t bg-card px-4 py-3">
        {replyToId && (
          <div className="mb-2 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Replying in thread</span>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => setReplyToId(null)}
            >
              Cancel
            </button>
          </div>
        )}
        <form
          onSubmit={handleSend}
          className="flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTextareaInput();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="min-h-[40px] max-h-[120px] w-full resize-none rounded-lg border bg-background px-3 py-2.5 pr-20 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-0.5">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Emoji
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Attach file
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={sending || !messageText.trim()}
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

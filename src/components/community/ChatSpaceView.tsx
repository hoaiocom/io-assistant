"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import useSWR from "swr";
import {
  format,
  isToday,
  isYesterday,
  formatDistanceToNow,
} from "date-fns";
import {
  Search,
  MoreHorizontal,
  Send,
  Smile,
  Paperclip,
  Image as ImageIcon,
  AtSign,
  Settings,
  Loader2,
  ChevronUp,
  ChevronDown,
  CornerUpLeft,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RichText } from "@/components/community/RichText";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ---- Types ----

interface ChatMessageSender {
  id: number;
  name: string;
  community_member_id: number;
  user_public_uid?: string;
  avatar_url: string | null;
}

interface ChatMessageReaction {
  emoji: string;
  count: number;
  community_member_ids: number[];
}

interface ChatRoomMessage {
  id: number;
  body: string;
  rich_text_body?: Record<string, unknown>;
  sent_at: string;
  created_at: string;
  edited_at?: string | null;
  chat_room_uuid: string;
  sender: ChatMessageSender;
  reactions: ChatMessageReaction[];
  replies_count: number;
  chat_thread_replies_count?: number;
  parent_message_id: number | null;
  last_reply_at?: string | null;
  total_thread_participants_count?: number;
  thread_participants_preview?: { id: number; name: string; avatar_url: string | null; community_member_id: number }[];
  thread_participant_avatar_urls?: string[];
  chat_thread_id?: number | null;
}

interface ChatMessagesResponse {
  id: number;
  has_previous_page: boolean;
  has_next_page: boolean;
  first_id: number;
  last_id: number;
  total_count: number;
  records: ChatRoomMessage[];
  error?: string;
}

interface Participant {
  id: number;
  community_member_id: number;
  name: string;
  avatar_url: string | null;
  admin: boolean;
  community_admin: boolean;
  moderator: boolean;
  status: string;
  headline?: string;
  user_public_uid?: string;
}

// ---- Helpers ----

const EMOJI_MAP: Record<string, string> = {
  thumbsup: "👍", heart: "❤️", joy: "😂", open_mouth: "😮",
  cry: "😢", pray: "🙏", tada: "🎉", "+1": "👍", fire: "🔥",
  clap: "👏", "100": "💯", rocket: "🚀", eyes: "👀",
  raised_hands: "🙌", thinking_face: "🤔", ok_hand: "👌",
  muscle: "💪", star_struck: "🤩", wave: "👋",
};

function emojiToDisplay(emoji: string): string {
  return EMOJI_MAP[emoji] || emoji;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatMessageTime(dateStr: string): string {
  try { return format(new Date(dateStr), "hh:mm a"); } catch { return ""; }
}

function formatDateSeparator(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM dd").toUpperCase();
  } catch { return ""; }
}

function safeTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return "";
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch { return ""; }
}

function formatTimestamp(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "hh:mm a");
    if (isYesterday(d)) return `Yesterday at ${format(d, "hh:mm a")}`;
    return `${format(d, "MMM d")} at ${format(d, "hh:mm a")}`;
  } catch { return ""; }
}

// ---- Main Component ----

interface ChatSpaceViewProps {
  space: {
    id: number;
    name: string;
    emoji?: string | null;
    description?: string;
    custom_description?: string;
    chat_room_description?: string;
    member_count?: number;
    members_count?: number;
  };
  spaceId: string;
}

export function ChatSpaceView({ space, spaceId }: ChatSpaceViewProps) {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [olderMessages, setOlderMessages] = useState<ChatRoomMessage[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [oldestId, setOldestId] = useState<number | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set());
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const initialScrollDone = useRef(false);
  const { data: authData } = useSWR("/api/community/auth", fetcher, {
    revalidateOnFocus: false,
  });
  const currentMemberId = authData?.communityMemberId as number | undefined;


  const {
    data: messagesData,
    isLoading,
    mutate,
    error: messagesError,
  } = useSWR<ChatMessagesResponse>(
    `/api/community/spaces/${spaceId}/chat-messages?previous_per_page=50`,
    fetcher,
    { refreshInterval: 5000 },
  );

  const { data: participantsData } = useSWR(
    `/api/community/spaces/${spaceId}/chat-participants?per_page=200`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60000 },
  );

  const latestRecords: ChatRoomMessage[] = useMemo(
    () => messagesData?.records || [],
    [messagesData],
  );

  useEffect(() => {
    if (messagesData && !messagesData.error) {
      setHasPreviousPage(messagesData.has_previous_page ?? false);
      if (latestRecords.length > 0) {
        const minId = Math.min(...latestRecords.map((m) => m.id));
        if (oldestId === null || minId < oldestId) setOldestId(minId);
      }
    }
  }, [messagesData, latestRecords, oldestId]);

  // Combine all raw messages (older + latest), deduplicate
  const allRawMessages: ChatRoomMessage[] = useMemo(() => {
    const map = new Map<number, ChatRoomMessage>();
    for (const m of olderMessages) map.set(m.id, m);
    for (const m of latestRecords) map.set(m.id, m);
    return Array.from(map.values());
  }, [olderMessages, latestRecords]);

  // Build reply map: parentId -> sorted replies
  const replyMap = useMemo(() => {
    const map = new Map<number, ChatRoomMessage[]>();
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

  // Top-level messages only, sorted chronologically
  const topLevelMessages: ChatRoomMessage[] = useMemo(() => {
    return allRawMessages
      .filter((m) => m.parent_message_id == null)
      .sort(
        (a, b) =>
          new Date(a.sent_at || a.created_at).getTime() -
          new Date(b.sent_at || b.created_at).getTime(),
      );
  }, [allRawMessages]);

  // Participants
  const participants: Participant[] = useMemo(() => {
    const raw = participantsData?.records || participantsData || [];
    return Array.isArray(raw) ? raw : [];
  }, [participantsData]);

  const onlineParticipants = useMemo(
    () => participants.filter((p) => p.status === "online"),
    [participants],
  );
  const offlineParticipants = useMemo(
    () => participants.filter((p) => p.status !== "online"),
    [participants],
  );
  const totalMembers =
    space.member_count || space.members_count || participants.length;
  const description =
    space.chat_room_description || space.description || space.custom_description || "";

  // Group top-level messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ChatRoomMessage[] }[] = [];
    let currentDate = "";
    for (const msg of topLevelMessages) {
      const date = format(new Date(msg.sent_at || msg.created_at), "yyyy-MM-dd");
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date: msg.sent_at || msg.created_at, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [topLevelMessages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && topLevelMessages.length > 0 && !initialScrollDone.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      initialScrollDone.current = true;
    }
  }, [isLoading, topLevelMessages.length]);

  // Auto-scroll only if near bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !initialScrollDone.current) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [latestRecords.length]);

  // Load older messages
  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasPreviousPage || oldestId === null) return;
    setLoadingOlder(true);
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    try {
      const res = await fetch(
        `/api/community/spaces/${spaceId}/chat-messages?id=${oldestId}&previous_per_page=30`,
      );
      const data: ChatMessagesResponse = await res.json();
      if (data.records?.length) {
        setOlderMessages((prev) => {
          const map = new Map<number, ChatRoomMessage>();
          for (const m of prev) map.set(m.id, m);
          for (const m of data.records) map.set(m.id, m);
          return Array.from(map.values());
        });
        const minId = Math.min(...data.records.map((m) => m.id));
        setOldestId(minId);
        setHasPreviousPage(data.has_previous_page ?? false);
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevScrollHeight;
          }
        });
      } else {
        setHasPreviousPage(false);
      }
    } catch {
      toast.error("Failed to load older messages");
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasPreviousPage, oldestId, spaceId]);

  // Scroll-to-top for infinite scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    function handleScroll() {
      if (container!.scrollTop < 80) loadOlderMessages();
    }
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loadOlderMessages]);

  // Toggle thread expand
  const toggleThread = useCallback((messageId: number) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }, []);

  const startReply = useCallback(
    (messageId: number) => {
      setExpandedThreads((prev) => {
        const next = new Set(prev);
        next.add(messageId);
        return next;
      });
      setReplyToId(messageId);
    },
    [],
  );

  // Send message
  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!messageText.trim()) return;
      setSending(true);
      try {
        await fetch(`/api/community/spaces/${spaceId}/chat-messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(replyToId ? { parent_message_id: replyToId } : {}),
            rich_text_body: {
              type: "doc",
              content: [
                { type: "paragraph", content: [{ type: "text", text: messageText }] },
              ],
            },
          }),
        });
        setMessageText("");
        setReplyToId(null);
        mutate();
      } catch {
        toast.error("Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [messageText, spaceId, mutate, replyToId],
  );

  const hasError = !!messagesError || messagesData?.error;

  return (
    <div className="flex h-full">
      {/* Main chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-card px-5 py-3">
          <div className="flex items-center gap-2">
            {space.emoji && <span className="text-lg">{space.emoji}</span>}
            <h1 className="text-base font-semibold">{space.name}</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {loadingOlder && (
            <div className="mb-4 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {hasPreviousPage && !loadingOlder && topLevelMessages.length > 0 && (
            <div className="mb-4 flex justify-center">
              <button
                onClick={loadOlderMessages}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Load older messages
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasError ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Unable to load messages for this chat space.
              </p>
            </div>
          ) : topLevelMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            groupedMessages.map((group, gi) => (
              <div key={gi}>
                <div className="my-5 flex items-center gap-3 first:mt-0">
                  <div className="flex-1 border-t" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {formatDateSeparator(group.date)}
                  </span>
                  <div className="flex-1 border-t" />
                </div>
                <div className="space-y-5">
                  {group.messages.map((msg) => {
                    const localReplies = replyMap.get(msg.id) || [];
                    const totalReplies =
                      msg.replies_count ||
                      msg.chat_thread_replies_count ||
                      localReplies.length;
                    const isExpanded = expandedThreads.has(msg.id);

                    return (
                      <div key={msg.id}>
                        <ChatMessageItem
                          message={msg}
                          threadCount={totalReplies}
                          isExpanded={isExpanded}
                          onToggleThread={() => toggleThread(msg.id)}
                          onReply={() => startReply(msg.id)}
                          currentMemberId={currentMemberId}
                          onToggleReaction={(message, emoji) => {
                            const existing = (message.reactions || []).find((r) => r.emoji === emoji);
                            const isActive =
                              currentMemberId != null &&
                              existing?.community_member_ids?.includes(currentMemberId);
                            fetch("/api/community/reactions", {
                              method: isActive ? "DELETE" : "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ chat_room_message: message.id, emoji }),
                            })
                              .then(() => mutate())
                              .catch(() => toast.error("Failed to update reaction"));
                          }}
                        />
                        {isExpanded && totalReplies > 0 && (
                          <ThreadPanel
                            parentMessage={msg}
                            localReplies={localReplies}
                            totalReplies={totalReplies}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="border-t bg-card px-5 py-3">
          {replyToId && (
            <div className="mb-2 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">Replying in thread</span>
              <button
                type="button"
                className="text-xs font-medium text-blue-600 hover:underline"
                onClick={() => setReplyToId(null)}
              >
                Cancel
              </button>
            </div>
          )}
          <form onSubmit={handleSend}>
            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-2 flex items-center">
              <div className="flex items-center gap-0.5">
                {[Smile, ImageIcon, Paperclip, AtSign].map((Icon, i) => (
                  <Button key={i} type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
              <div className="flex-1" />
              <Button
                type="submit"
                size="icon"
                disabled={sending || !messageText.trim()}
                className="h-8 w-8 rounded-full"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Right sidebar */}
      <aside className="hidden w-[260px] shrink-0 overflow-y-auto border-l bg-card xl:block">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Details</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">{totalMembers}</span>
              <Settings className="h-4 w-4" />
            </div>
          </div>

          {description && (
            <p className="mb-4 border-b pb-4 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}

          {onlineParticipants.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Online
              </h3>
              <div className="space-y-0.5">
                {onlineParticipants.map((p) => (
                  <ParticipantRow key={p.id} participant={p} online />
                ))}
              </div>
            </div>
          )}

          {offlineParticipants.length > 0 && (
            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Offline
              </h3>
              <div className="space-y-0.5">
                {offlineParticipants.map((p) => (
                  <ParticipantRow key={p.id} participant={p} online={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ---- Sub-components ----

function ChatMessageItem({
  message,
  threadCount,
  isExpanded,
  onToggleThread,
  onReply,
  currentMemberId,
  onToggleReaction,
}: {
  message: ChatRoomMessage;
  threadCount: number;
  isExpanded: boolean;
  onToggleThread: () => void;
  onReply: () => void;
  currentMemberId?: number;
  onToggleReaction: (message: ChatRoomMessage, emoji: string) => void;
}) {
  const { sender, body, reactions, sent_at, created_at, rich_text_body } = message;
  const time = formatMessageTime(sent_at || created_at);
  const initials = getInitials(sender.name);
  const lastReplyAgo = safeTimeAgo(message.last_reply_at);

  return (
    <div className="group relative flex gap-3">
      {/* Hover action bar */}
      <div className="pointer-events-none absolute -top-3 right-0 z-10 hidden items-center gap-0.5 rounded-lg border bg-card p-0.5 shadow-sm group-hover:flex">
        <TooltipProvider delayDuration={200}>
          {["heart", "thumbsup", "joy", "pray"].map((emoji) => (
            <Tooltip key={emoji}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onToggleReaction(message, emoji)}
                  className="pointer-events-auto rounded-md p-1.5 text-sm transition-colors hover:bg-muted"
                >
                  {emojiToDisplay(emoji)}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {emoji}
              </TooltipContent>
            </Tooltip>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onReply}
                className="pointer-events-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
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
      <Avatar className="mt-0.5 h-9 w-9 shrink-0">
        <AvatarImage src={sender.avatar_url || undefined} />
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{sender.name}</span>
          <span className="text-[11px] text-muted-foreground">{time}</span>
        </div>

        <div className="mt-1">
          <RichText tiptap={rich_text_body} html={body} text={body} />
        </div>

        {reactions && reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => onToggleReaction(message, r.emoji)}
                className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs hover:bg-muted"
              >
                <span>{emojiToDisplay(r.emoji)}</span>
                <span className="text-muted-foreground">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {threadCount > 0 && (
          <button
            onClick={onToggleThread}
            className="mt-2 flex items-center gap-2 rounded-md hover:bg-muted/50 px-1 py-0.5 -ml-1"
          >
            <ThreadAvatars message={message} />
            <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600">
              {threadCount} {threadCount === 1 ? "reply" : "replies"}
            </span>
            {lastReplyAgo && (
              <span className="text-[11px] text-muted-foreground">{lastReplyAgo}</span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ThreadAvatars({ message }: { message: ChatRoomMessage }) {
  const avatarUrls: string[] = [];

  if (message.thread_participant_avatar_urls?.length) {
    avatarUrls.push(...message.thread_participant_avatar_urls.slice(0, 3));
  } else if (message.thread_participants_preview?.length) {
    for (const p of message.thread_participants_preview.slice(0, 3)) {
      if (p.avatar_url) avatarUrls.push(p.avatar_url);
    }
  }

  if (avatarUrls.length === 0) return null;

  return (
    <div className="flex -space-x-1.5">
      {avatarUrls.map((url, i) => (
        <Avatar key={i} className="h-5 w-5 border-2 border-card">
          <AvatarImage src={url} />
          <AvatarFallback className="text-[7px]">?</AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

function ThreadPanel({
  parentMessage,
  localReplies,
  totalReplies,
}: {
  parentMessage: ChatRoomMessage;
  localReplies: ChatRoomMessage[];
  totalReplies: number;
}) {
  const [fetchedReplies, setFetchedReplies] = useState<ChatRoomMessage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const threadId = parentMessage.chat_thread_id;
    if (!threadId) {
      setFetchedReplies(localReplies.length > 0 ? localReplies : null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchError(false);
    fetch(`/api/community/chat-threads/${threadId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.replies && Array.isArray(data.replies)) {
          setFetchedReplies(data.replies);
        } else {
          setFetchedReplies(localReplies.length > 0 ? localReplies : []);
        }
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
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentMessage.chat_thread_id, parentMessage.id]);

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
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground">Loading replies…</span>
        </div>
      ) : fetchError && replies.length === 0 ? (
        <div className="px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">Failed to load replies</p>
        </div>
      ) : replies.length > 0 ? (
        <div className="divide-y">
          {replies.map((reply) => (
            <div key={reply.id} className="flex gap-2.5 px-4 py-3">
              <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                <AvatarImage src={reply.sender.avatar_url || undefined} />
                <AvatarFallback className="text-[9px]">
                  {getInitials(reply.sender.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{reply.sender.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatTimestamp(reply.sent_at || reply.created_at)}
                  </span>
                </div>
                <div className="mt-0.5">
                  <RichText
                    tiptap={reply.rich_text_body}
                    html={reply.body}
                    text={reply.body}
                  />
                </div>
                {reply.reactions && reply.reactions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {reply.reactions.map((r) => (
                      <span
                        key={r.emoji}
                        className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-1.5 py-0.5 text-[11px]"
                      >
                        <span>{emojiToDisplay(r.emoji)}</span>
                        <span className="text-muted-foreground">{r.count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
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

function ParticipantRow({ participant, online }: { participant: Participant; online: boolean }) {
  const isAdmin = participant.admin || participant.community_admin;
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50">
      <div className="relative">
        <Avatar className="h-7 w-7">
          <AvatarImage src={participant.avatar_url || undefined} />
          <AvatarFallback className="text-[9px]">
            {getInitials(participant.name)}
          </AvatarFallback>
        </Avatar>
        <div
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${online ? "bg-green-500" : "bg-gray-400"}`}
        />
      </div>
      <span className={`truncate text-sm ${online ? "" : "text-muted-foreground"}`}>
        {participant.name}
      </span>
      {isAdmin && (
        <Badge className="ml-auto shrink-0 bg-blue-600 px-1.5 py-0 text-[9px] leading-4 text-white hover:bg-blue-600">
          ADMIN
        </Badge>
      )}
    </div>
  );
}

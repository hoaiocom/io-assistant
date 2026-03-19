"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";
import {
  Search,
  Plus,
  X,
  Mail,
  Calendar,
  Clock,
  Award,
  ChevronRight,
  Users,
  PanelRightOpen,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getTiptapPlainText } from "@/lib/tiptap-renderer";
import { toast } from "sonner";
import { MemberAvatarHoverCard } from "@/components/community/MemberAvatarHoverCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Participant {
  id: number;
  name: string;
  avatar_url?: string | null;
  community_member_id?: number;
  headline?: string | null;
  bio?: string | null;
  status?: string | null;
  email?: string | null;
  admin?: boolean;
  moderator?: boolean;
}

interface ChatRoom {
  id: number;
  uuid: string;
  kind?: string;
  name?: string | null;
  unread_count?: number;
  participants_count?: number;
  participants?: Participant[];
  current_participant?: {
    id: number;
    name: string;
    avatar_url?: string | null;
    community_member_id?: number;
  } | null;
  last_message?: {
    id?: number;
    body?: string;
    rich_text_body?: Record<string, unknown>;
    created_at?: string;
    sender_name?: string;
    sender_avatar_url?: string | null;
    sender?: { name?: string; avatar_url?: string | null };
  } | null;
  updated_at?: string;
}

interface ProfileData {
  id: number;
  name: string;
  avatar_url?: string | null;
  large_avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  email?: string | null;
  created_at?: string;
  last_seen_at?: string;
  member_tags?: Array<{ id: number; name: string; is_public?: boolean }>;
  gamification_stats?: {
    total_points?: number;
    current_level?: number;
    current_level_name?: string;
  };
  profile_info?: Record<string, string | null>;
  posts_count?: number;
  comments_count?: number;
  spaces_count?: number;
  roles?: { admin?: boolean; moderator?: boolean };
}

function extractUuidFromPath(pathname: string): string | null {
  const match = pathname.match(/\/community\/chat\/([^/]+)/);
  return match ? match[1] : null;
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
  if ("body" in (input as Record<string, unknown>)) return input;
  if ("type" in (input as Record<string, unknown>)) return { body: input };
  return input;
}

function formatChatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return "Yesterday";
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 7) return format(d, "EEE");
    return format(d, "MMM d");
  } catch {
    return "";
  }
}

function getOtherParticipants(
  room: ChatRoom,
  currentMemberId?: number,
): Participant[] {
  const participants = room.participants || [];
  if (!currentMemberId) return participants;

  const currentCmId = room.current_participant?.community_member_id;
  const others = participants.filter((p) => {
    if (currentCmId && p.community_member_id) {
      return p.community_member_id !== currentCmId;
    }
    return p.id !== currentMemberId;
  });
  return others.length > 0 ? others : participants;
}

function OnlineIndicator({ status }: { status?: string | null }) {
  if (status !== "online") return null;
  return (
    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500" />
  );
}

function ConversationList({
  activeUuid,
  currentMemberId,
}: {
  activeUuid: string | null;
  currentMemberId?: number;
}) {
  const [filter, setFilter] = useState<"inbox" | "unread">("inbox");
  const [searchText, setSearchText] = useState("");
  const [newDmOpen, setNewDmOpen] = useState(false);
  const router = useRouter();

  const {
    data,
    isLoading,
    mutate: mutateChatRooms,
  } = useSWR(`/api/community/chat?page=1&per_page=50`, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 10000,
  });

  const chatRooms: ChatRoom[] = useMemo(() => {
    const rooms = data?.records || [];
    if (!Array.isArray(rooms)) return [];
    return rooms;
  }, [data]);

  const filteredRooms = useMemo(() => {
    let rooms = chatRooms;

    if (filter === "unread") {
      rooms = rooms.filter((r) => (r.unread_count ?? 0) > 0);
    }

    if (searchText) {
      const q = searchText.toLowerCase();
      rooms = rooms.filter((room) => {
        const others = getOtherParticipants(room, currentMemberId);
        const displayName =
          room.name ||
          others.map((p) => p.name).join(", ") ||
          "Chat";
        return displayName.toLowerCase().includes(q);
      });
    }

    return rooms;
  }, [chatRooms, filter, searchText, currentMemberId]);

  const handleCreateDm = useCallback(
    async (memberId: number) => {
      try {
        const res = await fetch("/api/community/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_room: {
              kind: "direct",
              community_member_ids: [memberId],
            },
          }),
        });
        const room = await res.json();
        if (room?.uuid) {
          setNewDmOpen(false);
          mutateChatRooms();
          router.push(`/community/chat/${room.uuid}`);
        } else {
          toast.error("Could not create conversation");
        }
      } catch {
        toast.error("Failed to start conversation");
      }
    },
    [router, mutateChatRooms],
  );

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="shrink-0 px-4 pt-4 pb-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">
              Direct Messages
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setNewDmOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-3 flex items-center gap-1">
            <button
              onClick={() => setFilter("inbox")}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                filter === "inbox"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              Inbox
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                filter === "unread"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              Unread
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search for a name"
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg p-3"
                >
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {searchText
                  ? "No conversations found"
                  : filter === "unread"
                    ? "No unread messages"
                    : "No conversations yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5 p-1.5">
              {filteredRooms.map((room) => {
                const others = getOtherParticipants(room, currentMemberId);
                const displayName =
                  room.name ||
                  others.map((p) => p.name).join(", ") ||
                  "Chat";
                const firstOther = others[0];
                const isActive = room.uuid === activeUuid;
                const unread = room.unread_count ?? 0;
                const lastMsg = room.last_message;
                const timeStr =
                  lastMsg?.created_at || room.updated_at;
                const timeDisplay = timeStr
                  ? formatChatTime(timeStr)
                  : "";
                const senderName =
                  lastMsg?.sender_name ||
                  lastMsg?.sender?.name;

                let preview = "";
                if (lastMsg?.rich_text_body) {
                  preview = getTiptapPlainText(normalizeTiptapBody(lastMsg.rich_text_body));
                } else if (typeof lastMsg?.body === "string") {
                  preview = lastMsg.body.replace(/<[^>]*>/g, "");
                }

                return (
                  <Link
                    key={room.uuid || room.id}
                    href={`/community/chat/${room.uuid || room.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      isActive
                        ? "bg-primary/10"
                        : unread > 0
                          ? "bg-primary/[0.03] hover:bg-muted/60"
                          : "hover:bg-muted/60",
                    )}
                  >
                    <div className="relative shrink-0">
                      {firstOther?.community_member_id ||
                      firstOther?.id ? (
                        <MemberAvatarHoverCard
                          memberId={
                            firstOther?.community_member_id || firstOther?.id
                          }
                          memberName={
                            firstOther?.name || displayName
                          }
                          avatarUrl={firstOther?.avatar_url || null}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={safeAvatarUrl(firstOther?.avatar_url)}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(
                                firstOther?.name || displayName,
                              )}
                            </AvatarFallback>
                          </Avatar>
                        </MemberAvatarHoverCard>
                      ) : (
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={safeAvatarUrl(firstOther?.avatar_url)}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(firstOther?.name || displayName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <OnlineIndicator status={firstOther?.status} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            unread > 0
                              ? "font-semibold"
                              : "font-medium",
                          )}
                        >
                          {displayName}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {timeDisplay}
                        </span>
                      </div>
                      {(preview || senderName) && (
                        <p
                          className={cn(
                            "mt-0.5 truncate text-xs",
                            unread > 0
                              ? "text-foreground/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {senderName ? `${senderName}: ` : ""}
                          {preview}
                        </p>
                      )}
                    </div>

                    {unread > 0 && (
                      <div className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {unread}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <NewDmDialog
        open={newDmOpen}
        onOpenChange={setNewDmOpen}
        onSelect={handleCreateDm}
      />
    </>
  );
}

function NewDmDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (memberId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useSWR(
    open && query.length >= 2
      ? `/api/community/members?search_text=${encodeURIComponent(query)}&per_page=10`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const members = data?.records || data || [];

  async function handleSelect(memberId: number) {
    setCreating(true);
    await onSelect(memberId);
    setCreating(false);
    setQuery("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a member..."
            autoFocus
          />
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : query.length < 2 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </p>
            ) : Array.isArray(members) && members.length > 0 ? (
              members.map(
                (m: {
                  id: number;
                  name: string;
                  avatar_url?: string;
                  headline?: string;
                }) => (
                  <button
                    key={m.id}
                    disabled={creating}
                    onClick={() => handleSelect(m.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={safeAvatarUrl(m.avatar_url)} />
                      <AvatarFallback className="text-xs">
                        {getInitials(m.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {m.name}
                      </p>
                      {m.headline && (
                        <p className="truncate text-xs text-muted-foreground">
                          {m.headline}
                        </p>
                      )}
                    </div>
                  </button>
                ),
              )
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No members found
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileSidebar({ uuid }: { uuid: string }) {
  const { data: room } = useSWR<ChatRoom>(
    `/api/community/chat/${uuid}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: authData } = useSWR("/api/community/auth", fetcher, {
    revalidateOnFocus: false,
  });
  const currentMemberId = authData?.communityMemberId;

  const otherMember = useMemo(() => {
    if (!room) return null;
    const others = getOtherParticipants(room, currentMemberId);
    return others[0] || room.participants?.[0] || null;
  }, [room, currentMemberId]);

  const memberId = otherMember?.community_member_id || otherMember?.id;

  const { data: profile, isLoading } = useSWR(
    memberId ? `/api/community/members/${memberId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isLoading || !profile) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Separator />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3.5 w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const prof = profile as ProfileData;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="p-5 text-center">
        <Avatar className="mx-auto mb-3 h-16 w-16">
          <AvatarImage
            src={safeAvatarUrl(prof.avatar_url || prof.large_avatar_url)}
          />
          <AvatarFallback className="text-lg">
            {getInitials(prof.name)}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-base font-semibold">{prof.name}</h3>
        {prof.headline && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {prof.headline}
          </p>
        )}
        {prof.roles &&
          (prof.roles.admin || prof.roles.moderator) && (
            <div className="mt-2 flex items-center justify-center gap-1.5">
              {prof.roles.admin && (
                <Badge variant="secondary" className="text-[10px]">
                  Admin
                </Badge>
              )}
              {prof.roles.moderator && (
                <Badge variant="secondary" className="text-[10px]">
                  Moderator
                </Badge>
              )}
            </div>
          )}
      </div>

      <Separator />

      <div className="space-y-4 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          About
        </h4>

        {prof.email && (
          <div className="flex items-start gap-2.5">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">Email</p>
              <p className="truncate text-xs">{prof.email}</p>
            </div>
          </div>
        )}

        {prof.created_at && (
          <div className="flex items-start gap-2.5">
            <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">
                Member since
              </p>
              <p className="text-xs">
                {format(new Date(prof.created_at), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        )}

        {prof.last_seen_at && (
          <div className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">
                Last seen
              </p>
              <p className="text-xs">
                {formatDistanceToNow(new Date(prof.last_seen_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        )}

        {prof.gamification_stats && (
          <div className="flex items-start gap-2.5">
            <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">
                Activity score
              </p>
              <p className="text-xs">
                {prof.gamification_stats.total_points} pts
                {prof.gamification_stats.current_level_name &&
                  ` · Level ${prof.gamification_stats.current_level}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {prof.member_tags && prof.member_tags.length > 0 && (
        <>
          <Separator />
          <div className="p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {prof.member_tags
                .filter((t) => t.is_public !== false)
                .map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-[10px]"
                  >
                    {tag.name}
                  </Badge>
                ))}
            </div>
          </div>
        </>
      )}

      {prof.bio && (
        <>
          <Separator />
          <div className="p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bio
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {prof.bio}
            </p>
          </div>
        </>
      )}

      {prof.profile_info &&
        Object.keys(prof.profile_info).length > 0 && (
          <>
            <Separator />
            <div className="space-y-3 p-4">
              {Object.entries(prof.profile_info)
                .filter(([, v]) => v)
                .map(([key, value]) => (
                  <div key={key}>
                    <p className="capitalize text-[11px] text-muted-foreground">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs">{value}</p>
                  </div>
                ))}
            </div>
          </>
        )}

      <div className="mt-auto p-4">
        <Link
          href={`/community/members/${memberId}`}
          className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
        >
          View full profile
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeUuid = extractUuidFromPath(pathname);
  const hasActiveChat = activeUuid !== null;
  const [showProfile, setShowProfile] = useState(true);

  const { data: authData } = useSWR("/api/community/auth", fetcher, {
    revalidateOnFocus: false,
  });
  const currentMemberId = authData?.communityMemberId;

  return (
    <div className="flex h-full">
      {/* Left panel: Conversation list */}
      <div
        className={cn(
          "w-full shrink-0 flex-col border-r bg-card md:w-80 md:flex lg:w-80",
          hasActiveChat ? "hidden md:flex" : "flex",
        )}
      >
        <ConversationList
          activeUuid={activeUuid}
          currentMemberId={currentMemberId}
        />
      </div>

      {/* Center panel: Message thread (children) */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          hasActiveChat ? "flex" : "hidden md:flex",
        )}
      >
        {children}
      </div>

      {/* Right panel: Profile sidebar (desktop only, when chat is active) */}
      {hasActiveChat && showProfile && (
        <div className="hidden w-80 shrink-0 flex-col border-l bg-card lg:flex">
          <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Profile</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setShowProfile(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ProfileSidebar uuid={activeUuid!} />
        </div>
      )}

      {hasActiveChat && !showProfile && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-16 z-10 hidden h-8 w-8 text-muted-foreground lg:flex"
          onClick={() => setShowProfile(true)}
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

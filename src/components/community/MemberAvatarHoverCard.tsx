"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
  MessageSquareText,
  Trophy,
  UserRound,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MemberProfileDialog } from "@/components/community/MemberProfileDialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PublicProfileForHover = {
  id: number;
  name: string;
  avatar_url?: string | null;
  headline?: string | null;
  profile_info?: Record<string, unknown>;
  gamification_stats?: {
    total_points?: number;
    current_level?: number | null;
    current_level_name?: string | null;
  } | null;
  can_receive_dm_from_current_member?: boolean | null;
  messaging_enabled?: boolean | null;
};

type ChatRoomForHover = {
  id: number;
  uuid: string;
  kind: string;
  participants: Array<{
    community_member_id: number;
  }>;
};

export function MemberAvatarHoverCard({
  memberId,
  memberName,
  avatarUrl,
  levelHint,
  children,
  className,
}: {
  memberId: number;
  memberName?: string;
  avatarUrl?: string | null;
  // Optional optimization: if caller already has level info.
  levelHint?: { current_level?: number | null; current_level_name?: string | null };
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = useMemo(() => {
    const n = memberName || "Member";
    return n
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [memberName]);

  const { data: profile } = useSWR<PublicProfileForHover>(
    open ? `/api/community/members/${memberId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: chatRooms } = useSWR<{ records: ChatRoomForHover[] }>(
    open ? `/api/community/chat?page=1&per_page=50` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const level = profile?.gamification_stats?.current_level ?? levelHint?.current_level ?? null;
  const levelName =
    profile?.gamification_stats?.current_level_name ?? levelHint?.current_level_name ?? null;

  const canMessage =
    profile?.messaging_enabled !== false &&
    profile?.can_receive_dm_from_current_member !== false;

  const directRoom = useMemo(() => {
    const records = chatRooms?.records || [];
    return records.find(
      (r) =>
        r.kind === "direct" &&
        Array.isArray(r.participants) &&
        r.participants.some((p) => p.community_member_id === memberId),
    );
  }, [chatRooms, memberId]);

  function buildInitials(name: string) {
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  async function handleMessageOrConnect() {
    try {
      // If direct room already exists, just navigate to it.
      if (directRoom?.uuid) {
        router.push(`/chat/${directRoom.uuid}`);
        return;
      }
      if (!canMessage) return;

      const res = await fetch("/api/community/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_room: { kind: "direct", community_member_ids: [memberId] },
        }),
      });
      if (!res.ok) return;
      const room = await res.json();
      if (room?.uuid) router.push(`/chat/${room.uuid}`);
    } catch {
      // Swallow hover action errors; errors are usually surfaced via toasts elsewhere.
    }
  }

  const title = profile?.name || memberName || "Member";
  const effectiveAvatar = profile?.avatar_url || avatarUrl;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn("inline-flex", className)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-[340px] overflow-hidden p-0"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="bg-card">
          <div className="flex items-start justify-between gap-4 p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <p className="truncate text-sm font-semibold text-foreground">
                  {title}
                </p>
              </div>

              <div className="mt-2 flex items-center gap-2">
                {level != null ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <span className="font-semibold">{level}</span>
                  </span>
                ) : (
                  <Skeleton className="h-6 w-24 rounded-full" />
                )}
                {levelName ? (
                  <Badge variant="secondary" className="rounded-full">
                    {levelName}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 flex-1 rounded-md"
                  onClick={handleMessageOrConnect}
                  disabled={!canMessage && !directRoom?.uuid}
                >
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Chat
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-md px-3"
                  onClick={() => {
                    setProfileOpen(true);
                    setOpen(false);
                  }}
                >
                  <UserRound className="mr-2 h-4 w-4" />
                  Profile
                </Button>
              </div>
            </div>

            <div className="shrink-0">
              <Avatar className="h-20 w-20">
                <AvatarImage src={effectiveAvatar || undefined} />
                <AvatarFallback className="text-sm">
                  {buildInitials(title)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
      <MemberProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        memberId={memberId}
        initialName={title}
        initialAvatarUrl={effectiveAvatar || null}
      />
    </>
  );
}


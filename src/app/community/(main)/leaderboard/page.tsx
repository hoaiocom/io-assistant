"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Trophy, Medal, Award, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberProfileDialog } from "@/components/community/MemberProfileDialog";
import { cn } from "@/lib/utils";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to fetch");
  return data;
};

interface LeaderboardMember {
  community_member_id: number;
  name: string;
  avatar_url?: string | null;
  points?: number;
  // Some Circle payloads use different keys for the same concept.
  points_earned?: number;
  score?: number;
  total_points?: number;
  level?: number;
  level_name?: string;
  rank?: number;
}

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
const PERIODS = [
  { id: "7_days", label: "7 days" },
  { id: "30_days", label: "30 days" },
  { id: "all_time", label: "All time" },
] as const;

const DEFAULT_LEVELS = [
  { level: 1, name: "Newcomer", points: 0 },
  { level: 2, name: "Observer", points: 10 },
  { level: 3, name: "Participant", points: 20 },
  { level: 4, name: "Influencer", points: 50 },
  { level: 5, name: "Contributor", points: 100 },
  { level: 6, name: "Enthusiast", points: 200 },
  { level: 7, name: "Pro", points: 500 },
  { level: 8, name: "Top Voice", points: 1000 },
  { level: 9, name: "Legend", points: 2026 },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("7_days");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileMemberId, setProfileMemberId] = useState<number | null>(null);
  const [profileInitialName, setProfileInitialName] = useState<string | undefined>(undefined);
  const [profileInitialAvatar, setProfileInitialAvatar] = useState<string | null>(null);

  const { data: profile, isLoading: loadingProfile } = useSWR(
    "/api/community/profile",
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data, isLoading } = useSWR(
    `/api/analytics/leaderboard?period=${period}`,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const { data: allTimeData } = useSWR(
    period === "all_time" ? null : "/api/analytics/leaderboard",
    fetcher,
    { revalidateOnFocus: false },
  );

  const leaders: LeaderboardMember[] = useMemo(
    () => data?.records || data || [],
    [data],
  );
  const fallbackLeaders: LeaderboardMember[] = useMemo(
    () => allTimeData?.records || allTimeData || [],
    [allTimeData],
  );
  const list = leaders.length > 0 ? leaders : fallbackLeaders;

  const currentPoints = profile?.gamification_stats?.total_points ?? 0;
  const currentLevel = profile?.gamification_stats?.current_level ?? 1;
  const currentLevelName = profile?.gamification_stats?.current_level_name ?? "Newcomer";
  const pointsToNext = profile?.gamification_stats?.points_to_next_level;
  const levelProgress = profile?.gamification_stats?.level_progress ?? 0;
  const userRank =
    list.find((m) => m.community_member_id === profile?.id)?.rank ||
    list.findIndex((m) => m.community_member_id === profile?.id) + 1 ||
    null;

  const currentUserName = profile?.name || "You";
  const currentUserAvatar = profile?.avatar_url || profile?.large_avatar_url || null;
  const initials = currentUserName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {profileMemberId != null && (
        <MemberProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          memberId={profileMemberId}
          initialName={profileInitialName}
          initialAvatarUrl={profileInitialAvatar}
        />
      )}

      <div className="mb-5 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
      </div>

      <div className="rounded-2xl border bg-card p-5">
        {loadingProfile ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.05fr_1fr]">
            <div className="space-y-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.05fr_1fr]">
            <div>
              <button
                type="button"
                className="flex items-center gap-3 text-left"
                onClick={() => {
                  if (!profile?.id) return;
                  setProfileMemberId(profile.id);
                  setProfileInitialName(currentUserName);
                  setProfileInitialAvatar(currentUserAvatar);
                  setProfileOpen(true);
                }}
              >
                <Avatar className="h-14 w-14 ring-2 ring-background">
                  <AvatarImage src={currentUserAvatar || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-2xl font-bold leading-none">{currentUserName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currentPoints.toLocaleString()} points
                  </p>
                </div>
              </button>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <span>
                  {currentLevel} · {currentLevelName}
                </span>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {pointsToNext != null
                  ? `${pointsToNext.toLocaleString()} points to level up`
                  : "Keep engaging to level up"}
                {userRank ? ` · Rank #${userRank}` : ""}
              </p>

              <div className="mt-3 h-1.5 w-full max-w-xs rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(0, Math.min(100, levelProgress))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {DEFAULT_LEVELS.map((lvl) => (
                <div key={lvl.level} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold",
                      currentLevel === lvl.level
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {lvl.level}
                  </span>
                  <div>
                    <p className={cn("font-medium", currentLevel === lvl.level && "text-primary")}>
                      {lvl.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lvl.points.toLocaleString()} points
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.id}
              variant={period === p.id ? "secondary" : "outline"}
              size="sm"
              onClick={() => setPeriod(p.id)}
              className="rounded-full px-4"
            >
              {p.label}
            </Button>
          ))}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <Info className="h-3.5 w-3.5" />
          How do points work?
        </button>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-4 rounded-xl border bg-card px-6 py-12 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Leaderboard data is not available yet.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Members
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {period === "all_time"
                ? "Total"
                : PERIODS.find((p) => p.id === period)?.label || "Points"}
            </p>
          </div>
          {list.map((member, index) => {
            const rank = member.rank || index + 1;
            const RankIcon = rank <= 3 ? rankIcons[rank - 1] : null;
            const rankColor = rank <= 3 ? rankColors[rank - 1] : "";
            const memberInitials = member.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const isCurrentMember = profile?.id === member.community_member_id;
            const pointsValue =
              member.points ??
              member.points_earned ??
              member.score ??
              member.total_points ??
              0;
            const isAllTime = period === "all_time";
            const pointsLabel = isAllTime
              ? pointsValue.toLocaleString()
              : `+${pointsValue.toLocaleString()}`;

            return (
              <button
                key={`${member.community_member_id}-${rank}`}
                type="button"
                onClick={() => {
                  setProfileMemberId(member.community_member_id);
                  setProfileInitialName(member.name);
                  setProfileInitialAvatar(member.avatar_url || null);
                  setProfileOpen(true);
                }}
                className={cn(
                  "flex w-full items-center gap-3 border-b px-4 py-3.5 text-left transition-colors hover:bg-muted/50",
                  "last:border-b-0",
                  isCurrentMember && "bg-primary/5",
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center">
                  {RankIcon ? (
                    <RankIcon className={`h-5 w-5 ${rankColor}`} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
                  )}
                </div>

                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{memberInitials}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {member.name}
                    {isCurrentMember ? " (You)" : ""}
                  </p>
                  {(member.level_name || member.level != null) && (
                    <p className="text-xs text-muted-foreground">
                      {member.level_name || `Level ${member.level}`}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-primary tabular-nums">
                    {pointsLabel}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isAllTime ? "pts" : "points"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

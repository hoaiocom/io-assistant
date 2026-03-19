"use client";

import useSWR from "swr";
import Link from "next/link";
import { Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface LeaderboardMember {
  community_member_id: number;
  name: string;
  avatar_url?: string | null;
  points: number;
  level: number;
  level_name: string;
  rank: number;
}

const rankIcons = [Trophy, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];

export default function LeaderboardPage() {
  const { data, isLoading } = useSWR("/api/analytics/leaderboard", fetcher, {
    revalidateOnFocus: false,
  });

  const leaders: LeaderboardMember[] = data?.records || data || [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h1 className="text-xl font-semibold tracking-tight">Leaderboard</h1>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ) : leaders.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <Trophy className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            Leaderboard data is not available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaders.map((member, index) => {
            const rank = member.rank || index + 1;
            const RankIcon = rank <= 3 ? rankIcons[rank - 1] : null;
            const rankColor = rank <= 3 ? rankColors[rank - 1] : "";
            const initials = member.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Link
                key={member.community_member_id}
                href={`/community/members/${member.community_member_id}`}
                className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-8 w-8 items-center justify-center">
                  {RankIcon ? (
                    <RankIcon className={`h-5 w-5 ${rankColor}`} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      #{rank}
                    </span>
                  )}
                </div>

                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{member.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Level {member.level}
                    {member.level_name && ` · ${member.level_name}`}
                  </p>
                </div>

                <Badge variant="secondary" className="shrink-0">
                  {(member.points ?? 0).toLocaleString()} pts
                </Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

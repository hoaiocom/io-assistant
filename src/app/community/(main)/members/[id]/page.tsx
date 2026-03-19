"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowLeft,
  Globe,
  MapPin,
  MessageCircle,
  FileText,
  MessageSquare,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [startingDm, setStartingDm] = useState(false);

  async function handleSendMessage() {
    setStartingDm(true);
    try {
      const res = await fetch("/api/community/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_room: { kind: "direct", community_member_ids: [Number(id)] },
        }),
      });
      const room = await res.json();
      if (room?.uuid) {
        router.push(`/community/chat/${room.uuid}`);
      } else {
        toast.error("Could not start conversation");
      }
    } catch {
      toast.error("Failed to start conversation");
    } finally {
      setStartingDm(false);
    }
  }

  const { data: profile, isLoading } = useSWR(
    `/api/community/members/${id}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Skeleton className="h-5 w-24 mb-6" />
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Member not found</p>
      </div>
    );
  }

  const initials = (profile.name || "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profileInfo = profile.profile_info || {};
  const stats = profile.gamification_stats;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link
        href="/community/members"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to members
      </Link>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 h-24" />

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <Avatar className="h-20 w-20 border-4 border-card">
              <AvatarImage src={profile.avatar_url || profile.large_avatar_url} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              {profile.roles?.admin && (
                <Badge variant="secondary">Admin</Badge>
              )}
              {profile.roles?.moderator && (
                <Badge variant="secondary">Moderator</Badge>
              )}
            </div>
            {profile.headline && (
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.headline}
              </p>
            )}
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>
          )}

          {profile.member_tags && profile.member_tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.member_tags
                .filter((t: { is_public?: boolean }) => t.is_public !== false)
                .map((tag: { id: number; name: string }) => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {profileInfo.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {profileInfo.location}
              </span>
            )}
            {profileInfo.website && (
              <a
                href={profileInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <Globe className="h-3.5 w-3.5" />
                Website
              </a>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="text-center">
              <p className="text-lg font-bold">{profile.posts_count || 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <FileText className="h-3 w-3" />
                Posts
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{profile.comments_count || 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Comments
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{profile.spaces_count || 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <FolderOpen className="h-3 w-3" />
                Spaces
              </p>
            </div>
          </div>

          {stats && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Level {stats.current_level}{" "}
                    {stats.current_level_name && `- ${stats.current_level_name}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.total_points} points
                  </p>
                </div>
                {stats.level_progress != null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {stats.points_to_next_level} pts to next level
                    </p>
                    <div className="mt-1 h-1.5 w-24 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${stats.level_progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {profile.can_receive_dm_from_current_member && profile.messaging_enabled && (
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={startingDm}
                onClick={handleSendMessage}
              >
                {startingDm ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                Send message
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

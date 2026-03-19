"use client";

import useSWR from "swr";
import {
  Globe,
  MapPin,
  Mail,
  FileText,
  MessageSquare,
  FolderOpen,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MyProfilePage() {
  const { data: profile, isLoading } = useSWR(
    "/api/community/profile",
    fetcher,
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <h1 className="mb-6 text-xl font-semibold tracking-tight">My Profile</h1>
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
        <p className="text-muted-foreground">Could not load your profile.</p>
      </div>
    );
  }

  const initials = (profile.name || "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">My Profile</h1>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 h-24" />

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <Avatar className="h-20 w-20 border-4 border-card">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-3">
            <h2 className="text-xl font-bold">{profile.name}</h2>
            {profile.headline && (
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.headline}
              </p>
            )}
          </div>

          {profile.bio && (
            <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {profile.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </span>
            )}
            {profile.profile_info?.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {profile.profile_info.location}
              </span>
            )}
            {profile.profile_info?.website && (
              <a
                href={profile.profile_info.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground"
              >
                <Globe className="h-3.5 w-3.5" />
                Website
              </a>
            )}
          </div>

          {profile.member_tags && profile.member_tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.member_tags.map((tag: { id: number; name: string }) => (
                <Badge key={tag.id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

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

          {profile.gamification_stats && (
            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Level {profile.gamification_stats.current_level}
                    {profile.gamification_stats.current_level_name &&
                      ` - ${profile.gamification_stats.current_level_name}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile.gamification_stats.total_points} points
                  </p>
                </div>
                {profile.gamification_stats.level_progress != null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {profile.gamification_stats.points_to_next_level} pts to next
                    </p>
                    <div className="mt-1 h-1.5 w-24 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${profile.gamification_stats.level_progress}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

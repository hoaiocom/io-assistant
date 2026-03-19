"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PostCard, type PostCardData } from "@/components/community/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type FeedSort =
  | "latest"
  | "popular"
  | "new_activity"
  | "oldest"
  | "likes"
  | "alphabetical";

const SORT_LABELS: Record<FeedSort, string> = {
  latest: "Latest",
  popular: "Popular",
  new_activity: "New activity",
  oldest: "Oldest",
  likes: "Likes",
  alphabetical: "Alphabetical",
};

type SpaceForBanner = {
  id: number;
  name: string;
  display_space_welcome_banner?: boolean;
  cover_image_url?: string | null;
};

type EventForSidebar = {
  id: number;
  display_title?: string;
  name?: string;
  created_at: string;
  space?: { id: number; slug?: string; name?: string };
  space_id?: number;
  event_setting_attributes?: { starts_at?: string };
  event_settings_attributes?: { starts_at?: string };
};

export default function CommunityFeedPage() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<FeedSort>("latest");

  const { data, isLoading, mutate } = useSWR(
    `/api/community/feed?page=${page}&per_page=20&sort=${sort}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const posts: PostCardData[] = data?.records || [];
  const hasNextPage = data?.has_next_page || false;

  const { data: spacesData } = useSWR("/api/community/spaces", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const bannerSpace: SpaceForBanner | null = useMemo(() => {
    const spaces: SpaceForBanner[] = Array.isArray(spacesData)
      ? spacesData
      : spacesData?.records || spacesData || [];
    const eligible = spaces.find(
      (s) => !!s.display_space_welcome_banner && !!s.cover_image_url,
    );
    return eligible || null;
  }, [spacesData]);

  const { data: upcomingEventsData, isLoading: upcomingLoading } = useSWR(
    "/api/community/events?per_page=3&past_events=false",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const upcomingEvents: EventForSidebar[] = useMemo(() => {
    const recs = upcomingEventsData?.records;
    return Array.isArray(recs) ? recs : [];
  }, [upcomingEventsData]);

  const { data: trendingData, isLoading: trendingLoading } = useSWR(
    "/api/community/feed?per_page=50&sort=popular&page=1",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const trendingPosts: PostCardData[] = useMemo(() => {
    const recs = trendingData?.records;
    const all: PostCardData[] = Array.isArray(recs) ? recs : [];
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const recent = all.filter((p) => {
      const d = new Date((p as any).created_at || (p as any).published_at || 0);
      return !isNaN(d.getTime()) && d.getTime() >= cutoff;
    });

    const score = (p: PostCardData) => {
      const anyP = p as any;
      const likes = Number(anyP.user_likes_count ?? anyP.likes_count ?? 0) || 0;
      const comments = Number(anyP.comment_count ?? anyP.comments_count ?? 0) || 0;
      return likes + comments;
    };

    const base = recent.length > 0 ? recent : all;
    return [...base].sort((a, b) => score(b) - score(a)).slice(0, 5);
  }, [trendingData]);

  const handleLike = useCallback(
    async (postId: number, liked: boolean) => {
      await fetch(`/api/community/posts/${postId}/like`, {
        method: liked ? "POST" : "DELETE",
      });
      mutate();
    },
    [mutate],
  );

  const handleBookmark = useCallback(
    async (postId: number, bookmarked: boolean) => {
      if (bookmarked) {
        await fetch("/api/community/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ record_id: postId, bookmark_type: "Post" }),
        });
      }
      mutate();
    },
    [mutate],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Feed</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              {SORT_LABELS[sort]}
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(
              [
                "latest",
                "popular",
                "likes",
                "new_activity",
                "alphabetical",
                "oldest",
              ] as const
            ).map((k) => (
              <DropdownMenuItem
                key={k}
                onClick={() => {
                  setSort(k);
                  setPage(1);
                }}
              >
                {SORT_LABELS[k]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="min-w-0 space-y-4">
          {bannerSpace?.cover_image_url ? (
            <div className="overflow-hidden rounded-2xl border bg-card">
              <div
                className="relative h-40 w-full bg-muted sm:h-48"
                style={{
                  backgroundImage: `url(${bannerSpace.cover_image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-black/0" />
                <div className="relative flex h-full items-end p-5">
                  <div className="max-w-[520px]">
                    <div className="text-xs font-medium text-white/85">
                      Welcome
                    </div>
                    <div className="mt-1 text-lg font-semibold tracking-tight text-white">
                      {bannerSpace.name}
                    </div>
                    <div className="mt-1 text-sm text-white/80">
                      Catch up on what’s new in your community.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="mt-4 h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1.5 h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border bg-card px-6 py-12 text-center">
              <p className="text-muted-foreground">
                No posts in your feed yet. Join some spaces to see content here.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                {page > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                )}
                {hasNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Load more
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold">Upcoming events</div>
                <Link
                  href="/community/events"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  View all
                </Link>
              </div>
              {upcomingLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No upcoming events.
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((e) => {
                    const spaceId = e.space?.id ?? e.space_id;
                    const title = e.display_title || e.name || "Event";
                    const startsAt =
                      e.event_setting_attributes?.starts_at ||
                      e.event_settings_attributes?.starts_at;
                    const day = startsAt ? new Date(startsAt) : new Date(e.created_at);
                    const dayNum = day.getDate();
                    const mon = day.toLocaleString(undefined, { month: "short" });
                    const href =
                      spaceId != null
                        ? `/community/spaces/${spaceId}/posts/${e.id}`
                        : "/community/events";

                    return (
                      <Link
                        key={e.id}
                        href={href}
                        className={cn(
                          "group flex items-start gap-3 rounded-lg p-2 transition-colors",
                          "hover:bg-muted/60",
                        )}
                      >
                        <div className="flex w-10 shrink-0 flex-col items-center rounded-md border bg-background px-2 py-1 text-center">
                          <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                            {mon}
                          </div>
                          <div className="text-sm font-semibold leading-none">
                            {dayNum}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium group-hover:underline">
                            {title}
                          </div>
                          {e.space?.name ? (
                            <div className="truncate text-xs text-muted-foreground">
                              {e.space.name}
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="mb-3 text-sm font-semibold">Trending posts</div>
              {trendingLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </div>
              ) : trendingPosts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No trending posts.</div>
              ) : (
                <div className="space-y-3">
                  {trendingPosts.map((p) => {
                    const anyP = p as any;
                    const title = anyP.display_title || anyP.name || "Post";
                    const spaceId = anyP.space?.id;
                    const href =
                      spaceId != null
                        ? `/community/spaces/${spaceId}/posts/${p.id}`
                        : "/community";
                    return (
                      <Link
                        key={p.id}
                        href={href}
                        className="block rounded-lg p-2 transition-colors hover:bg-muted/60"
                      >
                        <div className="line-clamp-2 text-sm font-medium hover:underline">
                          {title}
                        </div>
                        {anyP.space?.name ? (
                          <div className="mt-1 truncate text-xs text-muted-foreground">
                            {anyP.space.name}
                          </div>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

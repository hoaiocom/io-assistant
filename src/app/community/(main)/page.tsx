"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Loader2 } from "lucide-react";
import { PostCard, type PostCardData } from "@/components/community/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CommunityFeedPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, mutate } = useSWR(
    `/api/community/feed?page=${page}&per_page=20`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const posts: PostCardData[] = data?.records || [];
  const hasNextPage = data?.has_next_page || false;

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
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Home Feed</h1>

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

          <div className="mt-6 flex items-center justify-center gap-3">
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
  );
}

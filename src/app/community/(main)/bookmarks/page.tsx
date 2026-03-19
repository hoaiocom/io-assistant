"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Bookmark } from "lucide-react";
import { PostCard, type PostCardData } from "@/components/community/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function BookmarksPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, mutate } = useSWR(
    `/api/community/bookmarks?page=${page}&per_page=20`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const bookmarks = data?.records || [];
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

  const handleRemoveBookmark = useCallback(
    async (postId: number) => {
      const bookmark = bookmarks.find(
        (b: { bookmarkable_id: number; id: number }) => b.bookmarkable_id === postId || b.id === postId,
      );
      if (bookmark) {
        try {
          await fetch(`/api/community/bookmarks/${bookmark.id}`, {
            method: "DELETE",
          });
          mutate();
          toast.success("Bookmark removed");
        } catch {
          toast.error("Failed to remove bookmark");
        }
      }
    },
    [bookmarks, mutate],
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Bookmarks</h1>

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
            </div>
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            No bookmarks yet. Save posts you want to revisit later.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {bookmarks.map((bookmark: PostCardData & { bookmarkable?: PostCardData }) => {
              const post = bookmark.bookmarkable || bookmark;
              return (
                <PostCard
                  key={bookmark.id}
                  post={{ ...post, bookmark_id: bookmark.id }}
                  onLike={handleLike}
                  onBookmark={() => handleRemoveBookmark(post.id)}
                />
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            {page > 1 && (
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
            )}
            {hasNextPage && (
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
                Load more
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

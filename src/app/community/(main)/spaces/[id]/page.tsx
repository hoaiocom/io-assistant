"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Users, Lock, Globe, Plus } from "lucide-react";
import { PostCard, type PostCardData } from "@/components/community/PostCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("latest");
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: space, isLoading: spaceLoading } = useSWR(
    `/api/community/spaces/${id}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: postsData, isLoading: postsLoading, mutate } = useSWR(
    `/api/community/spaces/${id}/posts?page=${page}&per_page=20&sort=${sort}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const posts: PostCardData[] = postsData?.records || [];
  const hasNextPage = postsData?.has_next_page || false;

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

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`/api/community/spaces/${id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: postTitle, body: postBody }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      setPostTitle("");
      setPostBody("");
      setNewPostOpen(false);
      mutate();
      toast.success("Post created successfully");
    } catch {
      toast.error("Failed to create post");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    try {
      await fetch(`/api/community/spaces/${id}`, { method: "POST" });
      toast.success("Joined space");
    } catch {
      toast.error("Failed to join space");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {spaceLoading ? (
        <div className="mb-6">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : space ? (
        <div className="mb-6">
          {space.cover_image_url && (
            <div className="relative -mx-4 -mt-6 mb-5 aspect-[3/1] overflow-hidden sm:-mx-6 sm:rounded-xl">
              <img
                src={space.cover_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {space.emoji && (
                  <span className="text-xl">{space.emoji}</span>
                )}
                <h1 className="text-xl font-semibold tracking-tight">
                  {space.name}
                </h1>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                {space.is_private ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Globe className="h-3.5 w-3.5" />
                )}
                <span>{space.is_private ? "Private" : "Public"} space</span>
                {space.space_group_name && (
                  <>
                    <span>·</span>
                    <span>{space.space_group_name}</span>
                  </>
                )}
              </div>
            </div>

            {space.is_member === false && (
              <Button size="sm" onClick={handleJoin}>
                <Users className="mr-1.5 h-4 w-4" />
                Join
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-between gap-3">
        <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>

        {space?.policies?.can_create_post !== false && (
          <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new post</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="post-title">Title</Label>
                  <Input
                    id="post-title"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Post title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post-body">Content</Label>
                  <textarea
                    id="post-body"
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    placeholder="Write your post..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setNewPostOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Post"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {postsLoading ? (
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
      ) : posts.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-muted-foreground">
            No posts in this space yet. Be the first to start a conversation!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                spaceId={Number(id)}
                onLike={handleLike}
                onBookmark={handleBookmark}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            {page > 1 && (
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
            )}
            {hasNextPage && (
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

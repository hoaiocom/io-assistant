"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Users, Lock, Globe, Plus, Pin } from "lucide-react";
import { PostCard, type PostCardData } from "@/components/community/PostCard";
import { ChatSpaceView } from "@/components/community/ChatSpaceView";
import { CourseSpaceView, CourseLockedView } from "@/components/community/CourseSpaceView";
import { EventSpaceView } from "@/components/community/EventSpaceView";
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

function SpaceCoverImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const [proxyFailed, setProxyFailed] = useState(false);

  if (failed && proxyFailed) return null;

  const proxiedSrc = `/api/community/image-proxy?url=${encodeURIComponent(src)}`;
  const effectiveSrc = failed ? proxiedSrc : src;

  return (
    <img
      src={effectiveSrc}
      alt=""
      referrerPolicy="no-referrer"
      className="h-full w-full object-cover"
      onError={() => {
        if (!failed) setFailed(true);
        else setProxyFailed(true);
      }}
    />
  );
}

export default function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("latest");
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: space, isLoading: spaceLoading, mutate: mutateSpace } = useSWR(
    `/api/community/spaces/${id}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const isChatSpace = space?.space_type === "chat";
  const isCourseSpace = space?.space_type === "course";
  const isEventSpace = space?.space_type === "event";

  const { data: postsData, isLoading: postsLoading, mutate } = useSWR(
    !isChatSpace && !isCourseSpace && !isEventSpace ? `/api/community/spaces/${id}/posts?page=${page}&per_page=20&sort=${sort}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const posts: PostCardData[] = postsData?.records || [];
  const hasNextPage = postsData?.has_next_page || false;

  const pinnedPosts = posts.filter((p) => p.is_pinned_at_top_of_space);
  const regularPosts = posts.filter((p) => !p.is_pinned_at_top_of_space);

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
      mutateSpace();
      toast.success("Joined space");
    } catch {
      toast.error("Failed to join space");
    }
  }

  if (!spaceLoading && isChatSpace) {
    return <ChatSpaceView space={space} spaceId={id} />;
  }

  if (!spaceLoading && isCourseSpace && space) {
    if (space.is_member === false) {
      return <CourseLockedView space={space} onJoin={handleJoin} />;
    }
    return <CourseSpaceView space={space} spaceId={id} />;
  }

  if (!spaceLoading && isEventSpace && space) {
    return <EventSpaceView space={space} spaceId={id} />;
  }

  if (spaceLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-7 w-56" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="hidden sm:block">
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-4 w-11/12" />
                <Skeleton className="mt-2 h-4 w-10/12" />
                <Skeleton className="mt-2 h-4 w-7/12" />
              </div>
            ))}
          </div>

          <aside className="hidden lg:block">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-10/12" />
              <Skeleton className="mt-2 h-3 w-8/12" />
              <div className="mt-5 space-y-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Space header */}
      {spaceLoading ? (
        <div className="mb-6">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      ) : space ? (
        <div className="mb-6">
          {space.cover_image_url && (
            <div className="relative -mx-4 -mt-6 mb-5 aspect-[3/1] overflow-hidden sm:-mx-6 sm:rounded-xl">
              <SpaceCoverImage src={space.cover_image_url} />
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {space.emoji && <span className="text-xl">{space.emoji}</span>}
                <h1 className="text-xl font-semibold tracking-tight">{space.name}</h1>
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

      {/* Toolbar: sort + new post */}
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

        {space?.policies?.can_create_post !== false && space?.is_post_disabled !== true && (
          <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
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
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

      {/* Posts list */}
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
              <Skeleton className="mt-1.5 h-4 w-2/3" />
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
          {/* Pinned posts */}
          {pinnedPosts.length > 0 && (
            <div className="mb-4 space-y-4">
              {pinnedPosts.map((post) => (
                <div key={post.id} className="relative">
                  <div className="absolute -top-2 left-4 z-10 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <Pin className="h-3 w-3" />
                    Pinned
                  </div>
                  <PostCard
                    post={post}
                    spaceId={Number(id)}
                    showSpaceName={false}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Regular posts */}
          <div className="space-y-4">
            {regularPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                spaceId={Number(id)}
                showSpaceName={false}
                onLike={handleLike}
                onBookmark={handleBookmark}
              />
            ))}
          </div>

          {/* Pagination */}
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

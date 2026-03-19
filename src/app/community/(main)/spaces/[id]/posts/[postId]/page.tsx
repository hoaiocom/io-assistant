"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Bookmark,
  ArrowLeft,
  Send,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface CommentData {
  id: number;
  body: string;
  created_at: string;
  likes_count?: number;
  user_likes_count?: number;
  is_liked?: boolean;
  community_member?: {
    community_member_id?: number;
    id?: number;
    name: string;
    avatar_url?: string | null;
    headline?: string;
    roles?: { admin?: boolean; moderator?: boolean };
  };
  user_name?: string;
  user_avatar_url?: string | null;
}

export default function PostDetailPage() {
  const { id: spaceId, postId } = useParams<{ id: string; postId: string }>();
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentPage, setCommentPage] = useState(1);

  const { data: post, isLoading: postLoading, mutate: mutatePost } = useSWR(
    `/api/community/spaces/${spaceId}/posts/${postId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const { data: commentsData, isLoading: commentsLoading, mutate: mutateComments } = useSWR(
    `/api/community/posts/${postId}/comments?page=${commentPage}&per_page=30`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const comments: CommentData[] = commentsData?.records || [];
  const hasMoreComments = commentsData?.has_next_page || false;

  const handleLike = useCallback(async () => {
    if (!post) return;
    await fetch(`/api/community/posts/${postId}/like`, {
      method: post.is_liked ? "DELETE" : "POST",
    });
    mutatePost();
  }, [post, postId, mutatePost]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
      });
      if (!res.ok) throw new Error("Failed");
      setCommentBody("");
      mutateComments();
      mutatePost();
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  if (postLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Skeleton className="h-5 w-24 mb-6" />
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="mt-5 h-6 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  const author = post.community_member;
  const authorName = author?.name || post.user_name || "Unknown";
  const authorAvatar = author?.avatar_url || post.user_avatar_url;
  const authorId = author?.community_member_id || author?.id;
  const title = post.display_title || post.name || "";
  const likeCount = post.user_likes_count ?? post.likes_count ?? 0;
  const commentCount = post.comment_count ?? post.comments_count ?? 0;
  const timeAgo = formatDistanceToNow(new Date(post.published_at || post.created_at), {
    addSuffix: true,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link
        href={`/community/spaces/${spaceId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to space
      </Link>

      <article className="rounded-xl border bg-card">
        {post.cover_image_url && (
          <div className="relative aspect-[2.5/1] overflow-hidden rounded-t-xl">
            <img src={post.cover_image_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Link href={authorId ? `/community/members/${authorId}` : "#"}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={authorAvatar || undefined} />
                <AvatarFallback className="text-xs">{getInitials(authorName)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={authorId ? `/community/members/${authorId}` : "#"}
                  className="text-sm font-semibold hover:underline"
                >
                  {authorName}
                </Link>
                {author?.roles?.admin && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>

          {title && (
            <h1 className="mt-4 text-xl font-bold leading-snug">{title}</h1>
          )}

          {post.body && (
            <div
              className="prose prose-sm mt-4 max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          )}

          {post.topics && post.topics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {post.topics.map((t: { id: number; name: string }) => (
                <Badge key={t.id} variant="outline" className="text-xs font-normal">
                  {t.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center gap-1 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 h-8 px-3",
                post.is_liked
                  ? "text-red-500 hover:text-red-600"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={handleLike}
            >
              <Heart className={cn("h-4 w-4", post.is_liked && "fill-current")} />
              {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
            </Button>
            <div className="flex items-center gap-1.5 text-muted-foreground px-3">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{commentCount} comments</span>
            </div>
          </div>
        </div>
      </article>

      <div className="mt-6">
        <h2 className="mb-4 text-sm font-semibold">
          Comments ({commentCount})
        </h2>

        <form
          onSubmit={handleSubmitComment}
          className="mb-6 flex items-start gap-3"
        >
          <div className="flex-1">
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Write a comment..."
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" type="submit" disabled={submitting || !commentBody.trim()}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {submitting ? "Posting..." : "Reply"}
              </Button>
            </div>
          </div>
        </form>

        {commentsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const cAuthor = comment.community_member;
              const cName = cAuthor?.name || comment.user_name || "Unknown";
              const cAvatar = cAuthor?.avatar_url || comment.user_avatar_url;
              const cId = cAuthor?.community_member_id || cAuthor?.id;
              const cTime = formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              });

              return (
                <div key={comment.id} className="flex gap-3">
                  <Link href={cId ? `/community/members/${cId}` : "#"}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={cAvatar || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(cName)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="rounded-lg bg-muted/50 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={cId ? `/community/members/${cId}` : "#"}
                          className="text-sm font-semibold hover:underline"
                        >
                          {cName}
                        </Link>
                        {cAuthor?.roles?.admin && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div
                        className="mt-1 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: comment.body }}
                      />
                    </div>
                    <p className="mt-1 px-1 text-xs text-muted-foreground">{cTime}</p>
                  </div>
                </div>
              );
            })}

            {hasMoreComments && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCommentPage((p) => p + 1)}
                >
                  Load more comments
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

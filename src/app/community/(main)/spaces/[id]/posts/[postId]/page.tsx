"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { formatDistanceToNow, format } from "date-fns";
import {
  Heart,
  MessageCircle,
  Bookmark,
  ArrowLeft,
  Send,
  Share2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { resolveBodyHtml } from "@/lib/tiptap-renderer";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 7) return formatDistanceToNow(d, { addSuffix: true });
    if (d.getFullYear() === now.getFullYear()) return format(d, "MMM d");
    return format(d, "MMM d, yyyy");
  } catch {
    return "";
  }
}

function isAdmin(roles: unknown): boolean {
  if (Array.isArray(roles)) return roles.includes("admin");
  if (roles && typeof roles === "object" && "admin" in roles)
    return !!(roles as { admin: boolean }).admin;
  return false;
}

function isMod(roles: unknown): boolean {
  if (Array.isArray(roles)) return roles.includes("moderator");
  if (roles && typeof roles === "object" && "moderator" in roles)
    return !!(roles as { moderator: boolean }).moderator;
  return false;
}

// --------------- Types ---------------

interface MemberTag {
  id: number;
  name: string;
  emoji?: string;
  color?: string;
  is_public?: boolean;
}

interface CommentAuthor {
  id?: number;
  community_member_id?: number;
  name: string;
  avatar_url?: string | null;
  headline?: string;
  roles?: unknown;
  member_tags?: MemberTag[];
}

interface CommentData {
  id: number;
  body: unknown;
  body_text?: string;
  body_plain_text?: string;
  tiptap_body?: unknown;
  custom_html?: string | null;
  created_at: string;
  user_likes_count?: number;
  is_liked?: boolean;
  replies_count?: number;
  parent_comment_id?: number | null;
  replies?: CommentData[];
  author?: CommentAuthor;
  community_member?: CommentAuthor;
  user_name?: string;
  user_avatar_url?: string | null;
  policies?: {
    can_destroy?: boolean;
    can_edit?: boolean;
    can_report?: boolean;
  };
}

// --------------- Comment Component ---------------

function CommentItem({
  comment,
  postId,
  depth,
  onMutate,
}: {
  comment: CommentData;
  postId: string;
  depth: number;
  onMutate: () => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [liked, setLiked] = useState(comment.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(comment.user_likes_count ?? 0);
  const [expanded, setExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const cAuthor = comment.author || comment.community_member;
  const cName = cAuthor?.name || comment.user_name || "Unknown";
  const cAvatar = cAuthor?.avatar_url || comment.user_avatar_url;
  const cId = cAuthor?.community_member_id || cAuthor?.id;
  const cHeadline = cAuthor?.headline;
  const cDate = formatDate(comment.created_at);
  const cTags = cAuthor?.member_tags?.filter((t) => t.is_public !== false) || [];

  const { html: cHtml, plainText: cText } = resolveBodyHtml({
    tiptap_body: comment.tiptap_body,
    custom_html: comment.custom_html,
    body: comment.body,
    body_plain_text: comment.body_plain_text || comment.body_text,
  });

  const contentText = cText || "";
  const isLong = contentText.length > 300;
  const replies = comment.replies || [];

  async function handleLikeComment() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? c - 1 : c + 1));
    try {
      await fetch(`/api/community/comments/${comment.id}/like`, {
        method: wasLiked ? "DELETE" : "POST",
      });
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => (wasLiked ? c + 1 : c - 1));
    }
  }

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch(
        `/api/community/comments/${comment.id}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: replyText }),
        },
      );
      if (!res.ok) throw new Error("Failed");
      setReplyText("");
      setShowReplyForm(false);
      onMutate();
      toast.success("Reply posted");
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setReplying(false);
    }
  }

  return (
    <div className={cn(depth > 0 && "ml-11 border-l-2 border-muted pl-4")}>
      <div className="py-4">
        <div className="flex items-start gap-3">
          <Link href={cId ? `/community/members/${cId}` : "#"}>
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={cAvatar || undefined} />
              <AvatarFallback className="text-[10px] font-medium">
                {getInitials(cName)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            {/* Author info + date + menu */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={cId ? `/community/members/${cId}` : "#"}
                    className="text-sm font-semibold hover:underline"
                  >
                    {cName}
                  </Link>
                  {isAdmin(cAuthor?.roles) && (
                    <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 leading-4 rounded-[4px] hover:bg-blue-600 font-medium">
                      Admin
                    </Badge>
                  )}
                  {isMod(cAuthor?.roles) && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 leading-4 rounded-[4px] font-medium"
                    >
                      Mod
                    </Badge>
                  )}
                  {cTags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 leading-4 rounded-[4px] font-normal"
                      style={
                        tag.color
                          ? {
                              borderColor: tag.color,
                              color: tag.color,
                            }
                          : undefined
                      }
                    >
                      {tag.emoji && <span className="mr-0.5">{tag.emoji}</span>}
                      {tag.name}
                    </Badge>
                  ))}
                  {cDate && (
                    <>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {cDate}
                      </span>
                    </>
                  )}
                </div>
                {cHeadline && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {cHeadline}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground -mt-0.5"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Comment body */}
            <div className="mt-2">
              {cHtml ? (
                <div className="relative">
                  <div
                    className={cn(
                      "comment-body",
                      isLong && !expanded && "max-h-[120px] overflow-hidden",
                    )}
                    dangerouslySetInnerHTML={{ __html: cHtml }}
                  />
                  {isLong && !expanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                  )}
                </div>
              ) : cText ? (
                <div className="relative">
                  <p
                    className={cn(
                      "text-sm leading-relaxed whitespace-pre-wrap",
                      isLong && !expanded && "max-h-[120px] overflow-hidden",
                    )}
                  >
                    {cText}
                  </p>
                  {isLong && !expanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                  )}
                </div>
              ) : null}
              {isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-sm text-muted-foreground hover:text-foreground mt-0.5"
                >
                  {expanded ? "See less" : "... See more"}
                </button>
              )}
            </div>

            {/* Actions: Like / Reply + like count */}
            <div className="mt-2 flex items-center gap-1">
              <button
                onClick={handleLikeComment}
                className={cn(
                  "text-xs font-medium px-1 py-0.5 rounded hover:bg-muted transition-colors",
                  liked
                    ? "text-blue-600"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {liked ? "Liked" : "Like"}
              </button>
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground px-1 py-0.5 rounded hover:bg-muted transition-colors"
              >
                Reply
              </button>
              {likeCount > 0 && (
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3 text-red-400 fill-red-400" />
                  {likeCount} {likeCount === 1 ? "like" : "likes"}
                </span>
              )}
            </div>

            {/* Reply form */}
            {showReplyForm && (
              <form onSubmit={handleSubmitReply} className="mt-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${cName}...`}
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  autoFocus
                />
                <div className="mt-1.5 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 text-xs px-3"
                    disabled={replying || !replyText.trim()}
                  >
                    {replying ? "Posting..." : "Reply"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {replies.length > 0 && (
        <div>
          {replies.length > 2 && !showReplies && (
            <button
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline ml-12 mb-2"
            >
              <ChevronDown className="h-3 w-3" />
              Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </button>
          )}
          {(showReplies ? replies : replies.slice(0, 2)).map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              onMutate={onMutate}
            />
          ))}
          {showReplies && replies.length > 2 && (
            <button
              onClick={() => setShowReplies(false)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground ml-12 mb-2"
            >
              <ChevronUp className="h-3 w-3" />
              Hide replies
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// --------------- Post Detail Page ---------------

export default function PostDetailPage() {
  const { id: spaceId, postId } = useParams<{ id: string; postId: string }>();
  const [commentBody, setCommentBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentPage, setCommentPage] = useState(1);

  const {
    data: post,
    isLoading: postLoading,
    mutate: mutatePost,
  } = useSWR(
    `/api/community/spaces/${spaceId}/posts/${postId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const {
    data: commentsData,
    isLoading: commentsLoading,
    mutate: mutateComments,
  } = useSWR(
    `/api/community/posts/${postId}/comments?page=${commentPage}&per_page=50`,
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

  const handleBookmark = useCallback(async () => {
    if (!post) return;
    if (!post.bookmark_id) {
      await fetch("/api/community/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record_id: post.id, bookmark_type: "Post" }),
      });
    }
    mutatePost();
  }, [post, mutatePost]);

  function handleMutateComments() {
    mutateComments();
    mutatePost();
  }

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
      handleMutateComments();
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  // Loading skeleton
  if (postLoading) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-6 sm:px-6">
        <Skeleton className="h-5 w-28 mb-6" />
        <div className="rounded-xl border bg-card p-6 sm:p-8">
          <Skeleton className="h-7 w-3/4 mb-5" />
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-[680px] px-4 py-12 text-center">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  const author = post.community_member || post.author;
  const authorName = author?.name || post.user_name || "Unknown";
  const authorAvatar = author?.avatar_url || post.user_avatar_url;
  const authorId = author?.community_member_id || author?.id;
  const authorHeadline = author?.headline;
  const authorTags: MemberTag[] =
    author?.member_tags?.filter((t: MemberTag) => t.is_public !== false) || [];
  const title = post.display_title || post.name || "";
  const likeCount = post.user_likes_count ?? post.likes_count ?? 0;
  const commentCount = post.comment_count ?? post.comments_count ?? 0;
  const dateStr = formatDate(post.published_at || post.created_at);
  const { html: bodyHtml, plainText: bodyText } = resolveBodyHtml({
    tiptap_body: post.tiptap_body,
    custom_html: post.custom_html,
    body: post.body,
    body_plain_text: post.body_plain_text || post.body_text,
  });
  const coverImage = post.cover_image || post.cover_image_url;
  const firstLikedBy = post.first_liked_by || [];
  const isCommentsClosed = post.is_comments_closed ?? false;
  const isCommentsEnabled = post.is_comments_enabled ?? true;
  const isLikingEnabled = post.is_liking_enabled ?? true;
  const isPinned = post.is_pinned_at_top_of_space ?? false;

  return (
    <div className="mx-auto max-w-[680px] px-4 py-6 sm:px-6">
      {/* Back link */}
      <Link
        href={`/community/spaces/${spaceId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to space
      </Link>

      {/* ===== Post Card ===== */}
      <article className="rounded-xl border bg-card shadow-sm">
        {coverImage && (
          <div className="relative aspect-[2.5/1] overflow-hidden rounded-t-xl">
            <img
              src={coverImage}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-5 sm:p-7">
          {/* Title + actions */}
          {title && (
            <div className="flex items-start gap-3 mb-5">
              <h1 className="flex-1 text-[1.375rem] font-bold leading-snug tracking-tight">
                {title}
              </h1>
              <div className="flex items-center gap-0.5 shrink-0 -mt-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleBookmark}
                >
                  <Bookmark
                    className={cn(
                      "h-[18px] w-[18px]",
                      post.bookmark_id && "fill-current text-primary",
                    )}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground text-xs gap-1"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-[18px] w-[18px]" />
                </Button>
              </div>
            </div>
          )}

          {/* Author row */}
          <div className="flex items-center gap-3 mb-6">
            <Link href={authorId ? `/community/members/${authorId}` : "#"}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={authorAvatar || undefined} />
                <AvatarFallback className="text-xs font-medium">
                  {getInitials(authorName)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={authorId ? `/community/members/${authorId}` : "#"}
                  className="text-sm font-semibold hover:underline"
                >
                  {authorName}
                </Link>
                {isAdmin(author?.roles) && (
                  <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 leading-4 rounded-[4px] hover:bg-blue-600 font-medium">
                    Admin
                  </Badge>
                )}
                {isMod(author?.roles) && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 leading-4 rounded-[4px] font-medium"
                  >
                    Mod
                  </Badge>
                )}
                {authorTags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 leading-4 rounded-[4px] font-normal"
                    style={
                      tag.color
                        ? { borderColor: tag.color, color: tag.color }
                        : undefined
                    }
                  >
                    {tag.emoji && (
                      <span className="mr-0.5">{tag.emoji}</span>
                    )}
                    {tag.name}
                  </Badge>
                ))}
                {dateStr && (
                  <>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {dateStr}
                    </span>
                  </>
                )}
              </div>
              {authorHeadline && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {authorHeadline}
                </p>
              )}
            </div>
          </div>

          {/* Pinned indicator */}
          {isPinned && (
            <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 2l0 20M5 12l7-7 7 7" />
              </svg>
              Pinned post
            </div>
          )}

          {/* Body content */}
          {bodyHtml ? (
            <div
              className="post-body"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : bodyText ? (
            <div className="whitespace-pre-wrap text-[0.9375rem] leading-[1.75]">
              {bodyText}
            </div>
          ) : null}

          {/* Topics */}
          {post.topics && post.topics.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {post.topics.map((t: { id: number; name: string }) => (
                <Badge
                  key={t.id}
                  variant="outline"
                  className="text-xs font-normal"
                >
                  {t.name}
                </Badge>
              ))}
            </div>
          )}

          {/* ===== Action bar ===== */}
          <div className="mt-6 border-t pt-3">
            <div className="flex items-center">
              <div className="flex items-center gap-0.5">
                {isLikingEnabled && (
                  <button
                    onClick={handleLike}
                    className={cn(
                      "inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors",
                      post.is_liked
                        ? "text-red-500 hover:bg-red-50"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Heart
                      className={cn(
                        "h-[18px] w-[18px]",
                        post.is_liked && "fill-current",
                      )}
                    />
                  </button>
                )}
                {isCommentsEnabled && (
                  <button className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <MessageCircle className="h-[18px] w-[18px]" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {firstLikedBy.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {firstLikedBy
                      .slice(0, 3)
                      .map(
                        (
                          m: {
                            community_member_id?: number;
                            id?: number;
                            name: string;
                            avatar_url?: string | null;
                          },
                          i: number,
                        ) => (
                          <Avatar
                            key={m.community_member_id || m.id || i}
                            className="h-5 w-5 border-2 border-card"
                          >
                            <AvatarImage src={m.avatar_url || undefined} />
                            <AvatarFallback className="text-[7px]">
                              {getInitials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                        ),
                      )}
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  {likeCount > 0 && (
                    <>
                      {likeCount} {likeCount === 1 ? "like" : "likes"}
                    </>
                  )}
                  {likeCount > 0 && commentCount > 0 && " · "}
                  {commentCount > 0 && (
                    <>
                      {commentCount}{" "}
                      {commentCount === 1 ? "comment" : "comments"}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* ===== Comments Section ===== */}
      {isCommentsEnabled && (
        <div className="mt-4">
          {/* Threaded comments */}
          {commentsLoading ? (
            <div className="space-y-3 mt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 py-4">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="divide-y">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={postId}
                  depth={0}
                  onMutate={handleMutateComments}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No comments yet. Be the first to comment!
            </p>
          )}

          {hasMoreComments && (
            <div className="text-center py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCommentPage((p) => p + 1)}
                className="text-muted-foreground"
              >
                Load more comments
              </Button>
            </div>
          )}

          {/* Comment form */}
          {!isCommentsClosed ? (
            <div className="mt-2 border-t pt-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                  <AvatarFallback className="text-[10px]">You</AvatarFallback>
                </Avatar>
                <form onSubmit={handleSubmitComment} className="flex-1">
                  <div className="rounded-xl border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                    <textarea
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      placeholder="What are your thoughts?"
                      rows={2}
                      className="w-full border-0 bg-transparent px-4 pt-3 pb-2 text-sm placeholder:text-muted-foreground focus:outline-none resize-none"
                    />
                    <div className="flex justify-end px-3 pb-2">
                      <Button
                        size="sm"
                        type="submit"
                        disabled={submitting || !commentBody.trim()}
                        className="rounded-lg px-4 h-8"
                      >
                        {submitting ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="mt-4 border-t pt-4">
              <p className="text-center text-sm text-muted-foreground">
                Comments are closed for this post.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

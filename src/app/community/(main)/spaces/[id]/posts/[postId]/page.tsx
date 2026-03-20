"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { formatDistanceToNow, format } from "date-fns";
import {
  Heart,
  MessageCircle,
  Bookmark,
  ArrowLeft,
  Share2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Video,
  Monitor,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { resolveBodyHtml } from "@/lib/tiptap-renderer";
import { RichText } from "@/components/community/RichText";

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

function normalizeCommentHtmlForImages(html: string): string {
  // Tiptap can emit inline centering for images (e.g. margin-left/right:auto).
  // We normalize that for comment/reply thumbnails to always appear left-aligned.
  return html
    .replace(/margin-left:\s*auto;/gi, "margin-left:0;")
    .replace(/margin-right:\s*auto;/gi, "margin-right:0;")
    .replace(/margin:\s*0\s+auto;/gi, "margin:0 0;")
    .replace(/text-align:\s*center/gi, "text-align:left")
    .replace(/justify-content:\s*center/gi, "justify-content:flex-start");
}

function toIcsDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function downloadIcs({
  title,
  startsAt,
  endsAt,
  description,
  location,
}: {
  title: string;
  startsAt: Date;
  endsAt?: Date | null;
  description?: string | null;
  location?: string | null;
}) {
  const dtStart = toIcsDate(startsAt);
  const dtEnd = endsAt
    ? toIcsDate(endsAt)
    : toIcsDate(new Date(startsAt.getTime() + 60 * 60 * 1000));
  const now = toIcsDate(new Date());
  const uid = `${Math.random().toString(36).slice(2)}@io-assistant`;
  const clean = (s: string) =>
    s
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//io-assistant//circle-events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${clean(title || "Event")}`,
    location ? `LOCATION:${clean(location)}` : null,
    description ? `DESCRIPTION:${clean(description)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(title || "event").slice(0, 60).replace(/[^\w\- ]+/g, "").trim() || "event"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

function AttendeeAvatar({
  src,
  name,
}: {
  src?: string | null;
  name: string;
}) {
  if (!src) {
    return (
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full border bg-muted text-[10px] font-medium text-muted-foreground"
        aria-label={name}
        title={name}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      title={name}
      referrerPolicy="no-referrer"
      className="h-7 w-7 rounded-full border object-cover"
    />
  );
}

// --------------- Comment Component ---------------

function CommentItem({
  comment,
  postId,
  depth,
  parentCommentId,
  onMutate,
}: {
  comment: CommentData;
  postId: string;
  depth: number;
  parentCommentId?: number;
  onMutate: () => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [liked, setLiked] = useState(comment.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(comment.user_likes_count ?? 0);
  const [expanded, setExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [replyPage, setReplyPage] = useState(0);
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);
  const [hasMoreReplyPages, setHasMoreReplyPages] = useState(false);
  const [loadedReplies, setLoadedReplies] = useState<CommentData[] | null>(null);
  const [imageLightboxOpen, setImageLightboxOpen] = useState(false);
  const [imageLightboxSrc, setImageLightboxSrc] = useState<string | null>(null);

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

  const safeCHtml = normalizeCommentHtmlForImages(cHtml || "");
  const contentText = cText || "";
  const isLong = contentText.length > 300;
  const replies = loadedReplies ?? comment.replies ?? [];
  const totalReplies =
    typeof comment.replies_count === "number"
      ? comment.replies_count
      : replies.length;
  const canShowMoreReplies = totalReplies > replies.length || hasMoreReplyPages;

  useEffect(() => {
    setReplyPage(0);
    setHasMoreReplyPages(false);
    setLoadedReplies(null);
  }, [comment.id, comment.replies_count, (comment.replies || []).length]);
  const canDelete = comment.policies?.can_destroy === true;

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

  async function handleDelete() {
    try {
      let res: Response;
      if (depth > 0 && parentCommentId) {
        res = await fetch(
          `/api/community/comments/${parentCommentId}/replies/${comment.id}`,
          { method: "DELETE" },
        );
      } else {
        res = await fetch(`/api/community/posts/${postId}/comments/${comment.id}`, {
          method: "DELETE",
        });
      }
      if (!res.ok) throw new Error("Failed");
      onMutate();
      toast.success(depth > 0 ? "Reply deleted" : "Comment deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function handleLoadMoreReplies() {
    if (loadingMoreReplies) return;
    setLoadingMoreReplies(true);
    try {
      const nextPage = replyPage + 1;
      const res = await fetch(
        `/api/community/comments/${comment.id}/replies?page=${nextPage}&per_page=10`,
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as {
        records?: CommentData[];
        has_next_page?: boolean;
      };
      const incoming = Array.isArray(data.records) ? data.records : [];
      setLoadedReplies((prev) => {
        const base = prev ?? (comment.replies || []);
        const merged = [...base];
        const seen = new Set(merged.map((r) => r.id));
        for (const item of incoming) {
          if (!seen.has(item.id)) {
            merged.push(item);
            seen.add(item.id);
          }
        }
        return merged;
      });
      setReplyPage(nextPage);
      setHasMoreReplyPages(Boolean(data.has_next_page));
      setShowReplies(true);
    } catch {
      toast.error("Failed to load more replies");
    } finally {
      setLoadingMoreReplies(false);
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
              {canDelete ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground -mt-0.5"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>

            {/* Comment body */}
            <div className="mt-2">
              {cHtml ? (
                <div className="relative">
                  <div
                    className={cn(
                      "comment-body [&_img]:block [&_img]:h-28 [&_img]:w-28 [&_img]:max-w-none [&_img]:rounded-md [&_img]:border [&_img]:object-cover [&_img]:cursor-zoom-in [&_img]:ml-0 [&_img]:mr-auto [&_img]:my-1",
                      isLong && !expanded && "max-h-[120px] overflow-hidden",
                    )}
                    dangerouslySetInnerHTML={{ __html: safeCHtml }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target && target.tagName === "IMG") {
                        const img = target as HTMLImageElement;
                        if (img.src) {
                          setImageLightboxSrc(img.src);
                          setImageLightboxOpen(true);
                        }
                      }
                    }}
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
              {imageLightboxSrc && (
                <Dialog open={imageLightboxOpen} onOpenChange={setImageLightboxOpen}>
                  <DialogContent className="max-w-[100vw] w-screen h-screen p-0 border-0 bg-transparent shadow-none">
                    <div
                      className="relative h-full w-full flex items-center justify-center"
                      onClick={() => setImageLightboxOpen(false)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageLightboxSrc}
                        alt=""
                        className="max-h-[85vh] w-auto max-w-[92vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
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
              Show more replies
            </button>
          )}
          {(showReplies ? replies : replies.slice(0, 2)).map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              parentCommentId={comment.id}
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
          {showReplies && canShowMoreReplies && (
            <button
              type="button"
              onClick={handleLoadMoreReplies}
              disabled={loadingMoreReplies}
              className="ml-12 mb-2 text-xs font-medium text-primary hover:underline"
            >
              {loadingMoreReplies ? "Loading..." : "Show more replies"}
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
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const {
    data: post,
    isLoading: postLoading,
    mutate: mutatePost,
  } = useSWR(
    `/api/community/spaces/${spaceId}/posts/${postId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const commentsKey = (
    pageIndex: number,
    previousPageData?: { has_next_page?: boolean },
  ) => {
    if (previousPageData && previousPageData.has_next_page === false) return null;
    return `/api/community/posts/${postId}/comments?page=${pageIndex + 1}&per_page=50`;
  };
  const {
    data: commentsPages,
    isLoading: commentsLoading,
    mutate: mutateComments,
    size: commentsPageCount,
    setSize: setCommentsPageCount,
  } = useSWRInfinite(commentsKey, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const comments: CommentData[] =
    commentsPages?.flatMap((page) =>
      Array.isArray((page as { records?: unknown[] })?.records)
        ? ((page as { records: CommentData[] }).records ?? [])
        : [],
    ) ?? [];
  const hasMoreComments =
    (commentsPages?.length
      ? !!(commentsPages[commentsPages.length - 1] as { has_next_page?: boolean })
          ?.has_next_page
      : false) ?? false;

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
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
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
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
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
  const galleryImages =
    (post as {
      gallery?: { images?: Array<{ id: number; url?: string; original_url?: string }> };
    }).gallery?.images || [];
  const likeCount = post.user_likes_count ?? post.likes_count ?? 0;
  const commentCount = post.comment_count ?? post.comments_count ?? 0;
  const postFollowerId = (post as { post_follower_id?: number | null }).post_follower_id ?? null;
  const isFollowingPost = !!postFollowerId;
  const postFollowersCount = post.post_followers_count ?? post.followers_count ?? 0;
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
  const eventSettings =
    (post as any).event_setting_attributes ||
    (post as any).event_settings_attributes ||
    null;
  const startsAt =
    eventSettings?.starts_at ? new Date(eventSettings.starts_at) : null;
  const endsAt =
    eventSettings?.ends_at ? new Date(eventSettings.ends_at) : null;
  const locationType = eventSettings?.location_type as string | undefined;
  const locationLabel =
    locationType === "virtual"
      ? "Live Stream"
      : locationType === "live_room"
        ? "Live room"
        : eventSettings?.in_person_location || null;
  const locationUrl =
    (eventSettings?.virtual_location_url as string | undefined) || null;
  const hideAttendees = eventSettings?.hide_attendees === true;
  const hideLocationFromNonAttendees =
    eventSettings?.hide_location_from_non_attendees === true;
  const attendeeCount =
    (post as any)?.event_attendees?.count ??
    eventSettings?.rsvp_count ??
    0;
  const attendeePreview: Array<{
    id: number;
    name: string;
    avatar_url?: string | null;
  }> = (post as any)?.event_attendees?.records || [];
  const isGoing =
    (post as any)?.rsvped_event === true || (post as any)?.rsvp_status === "yes";
  const rsvpDisabled = eventSettings?.rsvp_disabled === true;

  async function handleRsvp() {
    try {
      const res = await fetch(`/api/community/events/${post.id}/rsvp`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      mutatePost();
      toast.success("RSVP confirmed!");
    } catch {
      toast.error("Failed to RSVP");
    }
  }

  async function handleFollowPost() {
    const previousPost = post;
    mutatePost(
      (current: any) => {
        if (!current) return current;
        const currentlyFollowing = !!current.post_follower_id;
        const nextCount = Math.max(
          0,
          Number(current.post_followers_count ?? current.followers_count ?? 0) +
            (currentlyFollowing ? -1 : 1),
        );
        return {
          ...current,
          post_follower_id: currentlyFollowing ? null : -1,
          post_followers_count: nextCount,
        };
      },
      false,
    );

    try {
      let res: Response;
      if (previousPost?.post_follower_id) {
        res = await fetch(
          `/api/community/posts/${postId}/followers/${previousPost.post_follower_id}`,
          { method: "DELETE" },
        );
      } else {
        res = await fetch(`/api/community/posts/${postId}/followers`, { method: "POST" });
      }
      if (!res.ok) throw new Error("Failed");
      mutatePost();
      toast.success(previousPost?.post_follower_id ? "Unfollowed post" : "Following post");
    } catch {
      mutatePost(previousPost, false);
      toast.error("Failed to update follow");
    }
  }

  const sidebarLocationLabel =
    locationType === "virtual"
      ? "Join live stream"
      : locationType === "live_room"
        ? "Go live"
        : null;
  const showJoinLink =
    !!locationUrl && (locationType === "virtual" || locationType === "live_room");
  const canShowLocationUrl =
    showJoinLink && (!hideLocationFromNonAttendees || isGoing);
  const LocationIcon = locationType === "live_room" ? Monitor : Video;
  const isEventPost = !!eventSettings;

  return (
    <div
      className={cn(
        "mx-auto px-4 py-6 sm:px-8",
        "max-w-6xl",
      )}
    >
      {/* Back link */}
      <Link
        href={`/community/spaces/${spaceId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {isEventPost ? "Events" : "space"}
      </Link>

      <div
        className={cn(
          isEventPost ? "grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]" : "",
        )}
      >
        <div>
          {/* ===== Post Card ===== */}
          <article className="rounded-xl border bg-card shadow-sm">
            {galleryImages.length > 0 ? (
              <div className="relative overflow-hidden rounded-t-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    galleryImages[galleryIndex]?.url ||
                    galleryImages[galleryIndex]?.original_url ||
                    ""
                  }
                  alt=""
                  className="h-full w-full aspect-square object-cover"
                />
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2 py-1 text-sm text-white hover:bg-black/80"
                      onClick={() =>
                        setGalleryIndex((i) =>
                          i === 0 ? galleryImages.length - 1 : i - 1,
                        )
                      }
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2 py-1 text-sm text-white hover:bg-black/80"
                      onClick={() =>
                        setGalleryIndex((i) =>
                          i === galleryImages.length - 1 ? 0 : i + 1,
                        )
                      }
                    >
                      ›
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                      {galleryImages.map((img, idx) => (
                        <button
                          key={img.id ?? idx}
                          type="button"
                          onClick={() => setGalleryIndex(idx)}
                          className={`h-1.5 w-4 rounded-full ${
                            idx === galleryIndex ? "bg-white" : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : coverImage ? (
              <div className="relative aspect-[2.5/1] overflow-hidden rounded-t-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}

            <div className="p-5 sm:p-7">
              {/* Title + actions */}
              {title && galleryImages.length === 0 && (
                <div className="flex items-start gap-3 mb-5">
                  <h1 className="flex-1 text-[1.375rem] font-bold leading-snug tracking-tight">
                    {title}
                  </h1>
                  <div className="flex items-center gap-0.5 shrink-0 -mt-0.5">
                    <Button
                      variant={isFollowingPost ? "secondary" : "outline"}
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={handleFollowPost}
                    >
                      {isFollowingPost ? "Following" : "Follow"}
                    </Button>
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
              {postFollowersCount > 0 && (
                <p className="mb-4 text-xs text-muted-foreground">
                  {postFollowersCount} follower{postFollowersCount === 1 ? "" : "s"}
                </p>
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
                        {tag.emoji && <span className="mr-0.5">{tag.emoji}</span>}
                        {tag.name}
                      </Badge>
                    ))}
                    {dateStr && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{dateStr}</span>
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

              {/* For non-event posts, keep small inline meta */}
              {!isEventPost && locationLabel && (
                <div className="mb-5 rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    {startsAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(startsAt, "EEEE, MMM d")} · {format(startsAt, "h:mm a")}
                          {endsAt ? ` – ${format(endsAt, "h:mm a")}` : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {locationUrl ? (
                        <a
                          href={locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-foreground"
                        >
                          {locationLabel}
                        </a>
                      ) : (
                        <span>{locationLabel}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Body content */}
              {bodyHtml || (post as any).tiptap_body || bodyText ? (
                <RichText tiptap={(post as any).tiptap_body} html={bodyHtml} text={bodyText} />
              ) : null}

              {/* Topics */}
              {post.topics && post.topics.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {post.topics.map((t: { id: number; name: string }) => (
                    <Badge key={t.id} variant="outline" className="text-xs font-normal">
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
                          className={cn("h-[18px] w-[18px]", post.is_liked && "fill-current")}
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
                        {firstLikedBy.slice(0, 3).map(
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
                          {commentCount} {commentCount === 1 ? "comment" : "comments"}
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
                      parentCommentId={undefined}
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
                    onClick={() => setCommentsPageCount((p) => p + 1)}
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

        {/* ===== Sidebar for event posts ===== */}
        {isEventPost && (
          <aside>
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl border bg-card p-4">
                {startsAt && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
                      <div className="text-center leading-tight">
                        <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                          {format(startsAt, "MMM")}
                        </div>
                        <div className="text-base font-semibold">{format(startsAt, "d")}</div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{format(startsAt, "EEEE, MMM d")}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {format(startsAt, "h:mm a")}
                        {endsAt ? ` – ${format(endsAt, "h:mm a")}` : ""}
                      </div>
                    </div>
                  </div>
                )}

                {canShowLocationUrl && sidebarLocationLabel && (
                  <a
                    href={locationUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-95"
                  >
                    <LocationIcon className="h-4 w-4" />
                    {sidebarLocationLabel}
                  </a>
                )}

                <div className="mt-3">
                  {isGoing ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-950/60">
                          <CheckCircle2 className="h-4 w-4" />
                          Going
                          <ChevronDown className="h-3 w-3 opacity-60" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem disabled className="gap-2 text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Going
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled className="gap-2">
                          Not going
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : rsvpDisabled ? (
                    <div className="inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-sm text-muted-foreground">
                      RSVP closed
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={handleRsvp}>
                      RSVP
                    </Button>
                  )}
                </div>

                {startsAt && (
                  <Button
                    variant="outline"
                    className="mt-3 w-full gap-2"
                    onClick={() =>
                      downloadIcs({
                        title: title || "Event",
                        startsAt,
                        endsAt,
                        description:
                          (post as any)?.body_plain_text_without_attachments ||
                          (post as any)?.body_plain_text ||
                          null,
                        location: locationLabel,
                      })
                    }
                  >
                    <Calendar className="h-4 w-4" />
                    Add to calendar
                  </Button>
                )}
              </div>

              {!hideAttendees && attendeeCount > 0 && (
                <div className="rounded-xl border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {attendeeCount} Attendee{attendeeCount !== 1 ? "s" : ""}
                    </div>
                    <Dialog open={attendeesOpen} onOpenChange={setAttendeesOpen}>
                      <DialogTrigger asChild>
                        <button className="text-sm font-medium text-primary hover:underline">
                          See all
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Attendees</DialogTitle>
                        </DialogHeader>
                        <EventAttendeesList eventId={post.id} preview={attendeePreview} />
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {attendeePreview.slice(0, 3).map((m) => (
                      <div key={m.id} className="flex items-center gap-2.5">
                        <AttendeeAvatar src={m.avatar_url} name={m.name} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{m.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function EventAttendeesList({
  eventId,
  preview,
}: {
  eventId: number;
  preview: Array<{ id: number; name: string; avatar_url?: string | null }>;
}) {
  const { data, isLoading, error } = useSWR(
    `/api/community/events/${eventId}/rsvp`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const records: Array<{ id: number; name: string; avatar_url?: string | null }> =
    data?.records || preview || [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
        Failed to load attendees.
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
        No attendees yet.
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-auto pr-1">
      <div className="space-y-2">
        {records.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5">
            <AttendeeAvatar src={m.avatar_url} name={m.name} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{m.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

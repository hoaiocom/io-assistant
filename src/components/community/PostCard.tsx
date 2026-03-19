"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { resolveBodyHtml } from "@/lib/tiptap-renderer";

interface PostAuthor {
  community_member_id?: number;
  id?: number;
  name: string;
  headline?: string;
  avatar_url?: string | null;
  roles?: { admin?: boolean; moderator?: boolean } | string[] | null;
  member_tags?: Array<{ id: number; name: string; color?: string }>;
}

interface LikedByMember {
  id?: number;
  community_member_id?: number;
  name: string;
  avatar_url?: string | null;
}

export interface PostCardData {
  id: number;
  name?: string | null;
  display_title?: string;
  slug: string;
  body?: unknown;
  body_text?: string;
  tiptap_body?: Record<string, unknown> | null;
  cover_image?: string | null;
  cardview_image?: string | null;
  cover_image_url?: string | null;
  space_id?: number;
  space_name?: string;
  space_slug?: string;
  comment_count?: number;
  comments_count?: number;
  user_likes_count?: number;
  likes_count?: number;
  is_liked?: boolean;
  bookmark_id?: number | null;
  published_at?: string | null;
  created_at: string;
  community_member?: PostAuthor;
  author?: PostAuthor;
  user_name?: string;
  user_avatar_url?: string | null;
  is_comments_enabled?: boolean;
  is_liking_enabled?: boolean;
  is_pinned_at_top_of_space?: boolean;
  post_type?: string;
  space_type?: string;
  topics?: Array<{ id: number; name: string; slug: string }>;
  first_liked_by?: LikedByMember[];
  hide_meta_info?: boolean;
}

interface PostCardProps {
  post: PostCardData;
  spaceId?: number;
  showSpaceName?: boolean;
  onLike?: (postId: number, liked: boolean) => void;
  onBookmark?: (postId: number, bookmarked: boolean) => void;
}

function getExcerpt(post: PostCardData): string {
  const { plainText } = resolveBodyHtml({
    tiptap_body: post.tiptap_body,
    body: post.body,
    body_plain_text: post.body_text,
  });
  return plainText;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function isAdmin(roles: PostAuthor["roles"]): boolean {
  if (Array.isArray(roles)) return roles.includes("admin");
  return !!roles?.admin;
}

function isModerator(roles: PostAuthor["roles"]): boolean {
  if (Array.isArray(roles)) return roles.includes("moderator");
  return !!roles?.moderator;
}

function safeTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

export function PostCard({ post, spaceId, showSpaceName = true, onLike, onBookmark }: PostCardProps) {
  const author = post.community_member || post.author;
  const authorName = author?.name || post.user_name || "Unknown";
  const authorAvatar = author?.avatar_url || post.user_avatar_url;
  const authorId = author?.community_member_id || author?.id;
  const authorHeadline = author?.headline;
  const title = post.display_title || post.name || "";
  const commentCount = post.comment_count ?? post.comments_count ?? 0;
  const likeCount = post.user_likes_count ?? post.likes_count ?? 0;
  const coverImage = post.cover_image || post.cardview_image || post.cover_image_url;
  const excerpt = getExcerpt(post);
  const sid = spaceId || post.space_id;
  const postHref = sid ? `/community/spaces/${sid}/posts/${post.id}` : "#";
  const timeAgo = safeTimeAgo(post.published_at || post.created_at);
  const initials = getInitials(authorName);

  return (
    <article className="rounded-xl border bg-card transition-shadow hover:shadow-sm">
      {coverImage && (
        <Link href={postHref}>
          <div className="relative aspect-[2.5/1] overflow-hidden rounded-t-xl">
            <img src={coverImage} alt="" className="h-full w-full object-cover" />
          </div>
        </Link>
      )}

      <div className="p-4 sm:p-5">
        {/* Author row */}
        <div className="flex items-start gap-3">
          <Link href={authorId ? `/community/members/${authorId}` : "#"}>
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={authorAvatar || undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
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
                <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 hover:bg-blue-600">
                  Admin
                </Badge>
              )}
              {isModerator(author?.roles) && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Mod
                </Badge>
              )}
              {timeAgo && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </>
              )}
            </div>
            {authorHeadline && (
              <p className="text-xs text-muted-foreground truncate">{authorHeadline}</p>
            )}
            {showSpaceName && post.space_name && (
              <Link
                href={`/community/spaces/${sid}`}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {post.space_name}
              </Link>
            )}
          </div>
        </div>

        {/* Title + body excerpt */}
        <Link href={postHref} className="mt-3 block">
          {title && (
            <h3 className="text-base font-semibold leading-snug hover:text-primary">
              {title}
            </h3>
          )}
          {excerpt && (
            <p className="mt-1.5 line-clamp-4 text-sm text-muted-foreground leading-relaxed">
              {excerpt}
            </p>
          )}
        </Link>

        {/* Topics */}
        {post.topics && post.topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.topics.map((t) => (
              <Badge key={t.id} variant="outline" className="text-xs font-normal">
                {t.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions footer */}
        <div className="mt-3 flex items-center gap-1 border-t pt-3">
          {post.is_liking_enabled !== false && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2.5",
                post.is_liked && "text-red-500 hover:text-red-600",
              )}
              onClick={(e) => {
                e.preventDefault();
                onLike?.(post.id, !post.is_liked);
              }}
            >
              <Heart className={cn("h-4 w-4", post.is_liked && "fill-current")} />
              {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
            </Button>
          )}

          {/* Liked-by avatars */}
          {post.first_liked_by && post.first_liked_by.length > 0 && (
            <div className="flex -space-x-1.5 ml-1">
              {post.first_liked_by.slice(0, 3).map((m, i) => (
                <Avatar key={m.community_member_id || m.id || i} className="h-5 w-5 border-2 border-card">
                  <AvatarImage src={m.avatar_url || undefined} />
                  <AvatarFallback className="text-[7px]">
                    {getInitials(m.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}

          {post.is_comments_enabled !== false && (
            <Link href={postHref} className="ml-1">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2.5"
              >
                <MessageCircle className="h-4 w-4" />
                {commentCount > 0 && (
                  <span className="text-xs">
                    {commentCount} {commentCount === 1 ? "comment" : "comments"}
                  </span>
                )}
              </Button>
            </Link>
          )}

          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2.5 text-muted-foreground hover:text-foreground",
              post.bookmark_id && "text-primary",
            )}
            onClick={(e) => {
              e.preventDefault();
              onBookmark?.(post.id, !post.bookmark_id);
            }}
          >
            <Bookmark className={cn("h-4 w-4", post.bookmark_id && "fill-current")} />
          </Button>
        </div>
      </div>
    </article>
  );
}

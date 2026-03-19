"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PostAuthor {
  community_member_id?: number;
  id?: number;
  name: string;
  headline?: string;
  avatar_url?: string | null;
  roles?: { admin?: boolean; moderator?: boolean } | null;
  member_tags?: Array<{ id: number; name: string; color?: string }>;
}

export interface PostCardData {
  id: number;
  name?: string | null;
  display_title?: string;
  slug: string;
  body?: string;
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
  user_name?: string;
  user_avatar_url?: string | null;
  is_comments_enabled?: boolean;
  is_liking_enabled?: boolean;
  post_type?: string;
  space_type?: string;
  topics?: Array<{ id: number; name: string; slug: string }>;
}

interface PostCardProps {
  post: PostCardData;
  spaceId?: number;
  onLike?: (postId: number, liked: boolean) => void;
  onBookmark?: (postId: number, bookmarked: boolean) => void;
}

function getPlainText(body?: unknown): string {
  if (typeof body === "string") {
    return body.replace(/<[^>]*>/g, "").trim();
  }
  return "";
}

export function PostCard({ post, spaceId, onLike, onBookmark }: PostCardProps) {
  const author = post.community_member;
  const authorName = author?.name || post.user_name || "Unknown";
  const authorAvatar = author?.avatar_url || post.user_avatar_url;
  const authorId = author?.community_member_id || author?.id;
  const title = post.display_title || post.name || "";
  const commentCount = post.comment_count ?? post.comments_count ?? 0;
  const likeCount = post.user_likes_count ?? post.likes_count ?? 0;
  const coverImage = post.cover_image || post.cardview_image || post.cover_image_url;
  const excerpt = getPlainText(post.body);
  const sid = spaceId || post.space_id;
  const postHref = sid ? `/community/spaces/${sid}/posts/${post.id}` : "#";
  const timeAgo = formatDistanceToNow(new Date(post.published_at || post.created_at), {
    addSuffix: true,
  });

  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="rounded-xl border bg-card transition-shadow hover:shadow-sm">
      {coverImage && (
        <Link href={postHref}>
          <div className="relative aspect-[2.5/1] overflow-hidden rounded-t-xl">
            <img
              src={coverImage}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </Link>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Link href={authorId ? `/community/members/${authorId}` : "#"}>
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={authorAvatar || undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
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
              {author?.roles?.moderator && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Mod
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{timeAgo}</span>
              {post.space_name && (
                <>
                  <span>·</span>
                  <Link
                    href={`/community/spaces/${sid}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {post.space_name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <Link href={postHref} className="mt-3 block">
          {title && (
            <h3 className="text-base font-semibold leading-snug hover:text-primary">
              {title}
            </h3>
          )}
          {excerpt && (
            <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
              {excerpt}
            </p>
          )}
        </Link>

        {post.topics && post.topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.topics.map((t) => (
              <Badge key={t.id} variant="outline" className="text-xs font-normal">
                {t.name}
              </Badge>
            ))}
          </div>
        )}

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
              <Heart
                className={cn("h-4 w-4", post.is_liked && "fill-current")}
              />
              {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
            </Button>
          )}
          {post.is_comments_enabled !== false && (
            <Link href={postHref}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2.5"
              >
                <MessageCircle className="h-4 w-4" />
                {commentCount > 0 && (
                  <span className="text-xs">{commentCount}</span>
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
            <Bookmark
              className={cn("h-4 w-4", post.bookmark_id && "fill-current")}
            />
          </Button>
        </div>
      </div>
    </article>
  );
}

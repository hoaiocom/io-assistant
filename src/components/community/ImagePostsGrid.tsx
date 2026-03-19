"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type ImageGridPost = {
  id: number;
  display_title?: string | null;
  name?: string | null;
  gallery?: {
    images?: Array<{
      id: number;
      url?: string | null;
      original_url?: string | null;
      filename?: string | null;
      width?: number | null;
      height?: number | null;
    }>;
  };
};

function proxied(src: string) {
  return `/api/community/image-proxy?url=${encodeURIComponent(src)}`;
}

function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const [proxyFailed, setProxyFailed] = useState(false);

  const effectiveSrc = failed ? proxied(src) : src;
  if (failed && proxyFailed) return null;

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={effectiveSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={className}
      onError={() => {
        if (!failed) setFailed(true);
        else setProxyFailed(true);
      }}
    />
  );
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ImagePostsGrid({ posts, spaceId }: { posts: ImageGridPost[]; spaceId: number }) {
  const tiles = useMemo(() => {
    return posts
      .map((p) => {
        const title = (p.display_title || p.name || "Image").toString();
        const images = p.gallery?.images || [];
        const first = images.find((img) => !!(img.url || img.original_url));
        const firstSrc = (first?.url || first?.original_url || "").toString();
        return { postId: p.id, title, images, firstSrc };
      })
      .filter((t) => !!t.firstSrc);
  }, [posts]);

  const [open, setOpen] = useState(false);
  const [activePostIdx, setActivePostIdx] = useState<number | null>(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const activeTile = activePostIdx == null ? undefined : tiles[activePostIdx];

  const {
    data: activePost,
    isLoading: postLoading,
  } = useSWR(
    open && activeTile
      ? `/api/community/spaces/${spaceId}/posts/${activeTile.postId}`
      : null,
    fetcher,
  );

  const activeImages =
    (activePost?.gallery?.images as ImageGridPost["gallery"]["images"] | undefined) ||
    activeTile?.images ||
    [];

  const activeSrc =
    (activeImages[activeImgIdx]?.url || activeImages[activeImgIdx]?.original_url || "").toString();

  const canPrev = activeImgIdx > 0;
  const canNext = activeImgIdx < activeImages.length - 1;

  const openPost = useCallback(
    (idx: number) => {
      setActivePostIdx(idx);
      setActiveImgIdx(0);
      setOpen(true);
    },
    [],
  );

  const goPrev = useCallback(() => {
    setActiveImgIdx((i) => (i > 0 ? i - 1 : i));
  }, []);

  const goNext = useCallback(() => {
    setActiveImgIdx((i) => (i < activeImages.length - 1 ? i + 1 : i));
  }, [activeImages.length]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, goPrev, goNext]);

  if (tiles.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t, idx) => (
          <button
            key={t.postId}
            type="button"
            onClick={() => openPost(idx)}
            className="group relative overflow-hidden rounded-xl border bg-muted"
          >
            <div className="aspect-square">
              <Img
                src={t.firstSrc}
                alt={t.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl p-0">
          <div className="flex max-h-[80vh] min-h-[60vh] flex-col bg-background text-foreground sm:flex-row">
            <div className="relative flex-1 bg-card">
              {postLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-40 w-40 rounded-xl" />
                </div>
              ) : activeSrc ? (
                <Img
                  src={proxied(activeSrc)}
                  alt={(activePost?.display_title || activePost?.name || "Image").toString()}
                  className="h-full w-full object-cover"
                />
              ) : null}

              {activeImages.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9"
                    onClick={goPrev}
                    disabled={!canPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9"
                    onClick={goNext}
                    disabled={!canNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                    {activeImages.map((_, i) => (
                      <button
                        // eslint-disable-next-line react/no-array-index-key
                        key={i}
                        type="button"
                        onClick={() => setActiveImgIdx(i)}
                        className={`h-1.5 w-4 rounded-full ${
                          i === activeImgIdx ? "bg-white" : "bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-3 top-3 h-9 w-9"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex w-full max-w-md flex-col border-t bg-card p-4 sm:h-full sm:border-l sm:border-t-0">
              {postLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : activePost ? (
                <>
                  <div className="mb-3">
                    {!(activePost.gallery && Array.isArray(activePost.gallery.images) && activePost.gallery.images.length > 0) && (
                      <>
                        <div className="text-xs text-muted-foreground">
                          Post details
                        </div>
                        <div className="mt-1 text-sm font-medium">
                          {(activePost.display_title || activePost.name || "Untitled").toString()}
                        </div>
                      </>
                    )}
                    {activePost.author?.name && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {activePost.author.name}
                      </div>
                    )}
                  </div>
                  {activePost.body_plain_text && (
                    <p className="mb-3 whitespace-pre-wrap text-sm text-muted-foreground">
                      {activePost.body_plain_text}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">
                        {(activePost.user_likes_count ??
                          activePost.likes_count ??
                          0) as number}{" "}
                      </span>
                      likes ·{" "}
                      <span className="font-medium">
                        {(activePost.comment_count ??
                          activePost.comments_count ??
                          0) as number}{" "}
                      </span>
                      comments
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <Link href={`/community/spaces/${spaceId}/posts/${activeTile?.postId ?? ""}`}>
                        View full post
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Failed to load post details.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


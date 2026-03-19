"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Search, FileText, MessageSquare, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/hooks/use-debounce";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SearchResult {
  id: number;
  name?: string;
  display_title?: string;
  body?: string;
  slug?: string;
  space_id?: number;
  space_name?: string;
  record_type?: string;
  community_member?: {
    name: string;
    avatar_url?: string | null;
    community_member_id?: number;
  };
  user_name?: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useSWR(
    debouncedQuery
      ? `/api/community/search?q=${encodeURIComponent(debouncedQuery)}&per_page=30`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/community/search?q=${encodeURIComponent(debouncedQuery)}`, {
        scroll: false,
      });
    }
  }, [debouncedQuery, router]);

  const results: SearchResult[] = data?.records || [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Search</h1>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts, comments, members..."
          className="pl-9"
          autoFocus
        />
      </div>

      {!debouncedQuery ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            Type something to search the community.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-muted-foreground">
            No results found for &quot;{debouncedQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((result) => {
            const title = result.display_title || result.name || "Untitled";
            const excerpt = result.body
              ? result.body.replace(/<[^>]*>/g, "").slice(0, 150)
              : "";
            const author = result.community_member;
            const authorName = author?.name || result.user_name;
            const href = result.space_id
              ? `/community/spaces/${result.space_id}/posts/${result.id}`
              : "#";

            return (
              <Link
                key={`${result.record_type}-${result.id}`}
                href={href}
                className="block rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{title}</h3>
                      {result.record_type && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {result.record_type}
                        </Badge>
                      )}
                    </div>
                    {excerpt && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {excerpt}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      {authorName && <span>by {authorName}</span>}
                      {result.space_name && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {result.space_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

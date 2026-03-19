"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  Search,
  Hash,
  FileText,
  MessageSquare,
  Users,
  GraduationCap,
  AtSign,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SearchResult {
  id: number;
  name?: string;
  display_title?: string;
  highlighted_name?: string;
  body?: string;
  highlighted_body?: string;
  slug?: string;
  space_id?: number;
  space_name?: string;
  record_type?: string;
  type?: string;
  post_id?: number;
  headline?: string;
  community_member?: {
    name: string;
    avatar_url?: string | null;
    community_member_id?: number;
  };
  user_name?: string;
}

type SearchType =
  | "all"
  | "posts"
  | "comments"
  | "members"
  | "spaces"
  | "lessons"
  | "mentions";

const SEARCH_TABS: Array<{ id: SearchType; label: string; icon: React.ReactNode }> = [
  { id: "all", label: "All", icon: <Search className="h-3.5 w-3.5" /> },
  { id: "posts", label: "Posts", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "comments", label: "Comments", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { id: "members", label: "Members", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "spaces", label: "Spaces", icon: <Hash className="h-3.5 w-3.5" /> },
  { id: "lessons", label: "Lessons", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  { id: "mentions", label: "Mentions", icon: <AtSign className="h-3.5 w-3.5" /> },
];

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, "");
}

function applyHighlightStyling(html: string) {
  if (!html) return "";
  const openSpan =
    '<span class="bg-yellow-100 dark:bg-yellow-900/40 rounded px-0.5">';
  const closeSpan = "</span>";

  return html
    // Normalize <strong> and </strong>
    .replace(/<strong>/gi, openSpan)
    .replace(/<\/strong>/gi, closeSpan)
    // Normalize <mark> and </mark> (some endpoints use <mark> for highlights)
    .replace(/<mark>/gi, openSpan)
    .replace(/<\/mark>/gi, closeSpan);
}

function getRecordType(result: SearchResult) {
  return (result.record_type || result.type || "").toLowerCase();
}

function getTitleHtml(result: SearchResult) {
  const raw =
    result.display_title ||
    result.highlighted_name ||
    result.name ||
    result.headline ||
    "Untitled";
  return applyHighlightStyling(raw);
}

function getBodyText(result: SearchResult) {
  const raw = result.highlighted_body || result.body || "";
  return applyHighlightStyling(raw);
}

function getResultHref(result: SearchResult): string | null {
  const type = getRecordType(result);

  if (type === "post") {
    if (typeof result.space_id === "number")
      return `/community/spaces/${result.space_id}/posts/${result.id}`;
    return null;
  }

  if (type === "comment") {
    if (typeof result.space_id === "number" && typeof result.post_id === "number") {
      // Pending: comment deep links to a specific comment.
      return `/community/spaces/${result.space_id}/posts/${result.post_id}`;
    }
    return null;
  }

  if (type === "space") {
    return `/community/spaces/${result.id}`;
  }

  if (type === "lesson") {
    if (typeof result.space_id === "number") return `/community/spaces/${result.space_id}`;
    return null;
  }

  if (type === "member") {
    return `/community/members/${result.id}`;
  }

  return null;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const initialType = (searchParams.get("type") || "all") as SearchType;
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  const [type, setType] = useState<SearchType>(initialType);

  const endpoint = type === "all" ? "/api/community/search" : "/api/community/advanced-search";

  const { data, isLoading, error } = useSWR(
    debouncedQuery.length > 3
      ? `${endpoint}?q=${encodeURIComponent(debouncedQuery)}&per_page=30${
          type !== "all" ? `&type=${encodeURIComponent(type)}` : ""
        }`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    if (debouncedQuery.length > 3) {
      const sp = new URLSearchParams();
      sp.set("q", debouncedQuery);
      if (type !== "all") sp.set("type", type);
      router.replace(`/community/search?${sp.toString()}`, {
        scroll: false,
      });
    }
  }, [debouncedQuery, type, router]);

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

      <div className="mb-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {SEARCH_TABS.map((t) => {
          const active = t.id === type;
          return (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className="h-8 rounded-full px-3 text-xs gap-1.5 shrink-0"
              onClick={() => setType(t.id)}
            >
              {t.icon}
              {t.label}
            </Button>
          );
        })}
      </div>

      {query.length <= 3 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            Type at least 4 characters to search the community.
          </p>
        </div>
      ) : error || data?.error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-muted-foreground">Search failed. Please try again.</p>
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
            const title = getTitleHtml(result);
            const excerpt = getBodyText(result).slice(0, 200);
            const author = result.community_member;
            const authorName = author?.name || result.user_name;
            const href = getResultHref(result);
            const recordType = getRecordType(result) || "result";

            return (
              <Link
                key={`${recordType}-${result.id}`}
                href={href || "#"}
                aria-disabled={!href}
                className={`block rounded-lg border bg-card p-4 transition-colors ${
                  href ? "hover:bg-muted/50" : "opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-sm font-semibold"
                        dangerouslySetInnerHTML={{ __html: title }}
                      />
                      {recordType && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {recordType}
                        </Badge>
                      )}
                    </div>
                    {excerpt && (
                      <p
                        className="mt-1 line-clamp-2 text-xs text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: excerpt }}
                      />
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

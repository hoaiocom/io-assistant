"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import {
  Search,
  Bell,
  Menu,
  LogOut,
  Loader2,
  User,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const navItems = [
  { label: "Community", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Chat", href: "/chat" },
  { label: "Events", href: "/events" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Members", href: "/members" },
];

interface CommunityHeaderProps {
  onMenuClick: () => void;
}

export function CommunityHeader({ onMenuClick }: CommunityHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);

  const { data: profile } = useSWR("/api/community/profile", fetcher, {
    revalidateOnFocus: false,
  });
  const { data: notifCount } = useSWR(
    "/api/community/notifications?count=true",
    fetcher,
    { refreshInterval: 30000 },
  );

  const totalNotifs =
    (notifCount?.new_notifications_count || 0) +
    (notifCount?.new_mentions_count || 0);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/community/auth", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/community/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  }

  type SearchSuggestion = {
    id: number;
    display_title?: string;
    name?: string;
    highlighted_name?: string;
    record_type?: string;
    type?: string;
    space_id?: number;
    post_id?: number;
  };

  const { data: searchData } = useSWR(
    searchOpen && debouncedSearch.trim().length > 3
      ? `/api/community/search?q=${encodeURIComponent(debouncedSearch.trim())}&per_page=5`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const suggestions: SearchSuggestion[] = searchData?.records || [];

  function getSuggestionType(s: SearchSuggestion) {
    return (s.record_type || s.type || "").toString().toLowerCase();
  }

  function getSuggestionHref(s: SearchSuggestion): string | null {
    const t = getSuggestionType(s);

    if (t === "post") {
      if (typeof s.space_id === "number")
        return `/community/spaces/${s.space_id}/posts/${s.id}`;
      return null;
    }

    if (t === "comment") {
      if (typeof s.space_id === "number" && typeof s.post_id === "number") {
        return `/community/spaces/${s.space_id}/posts/${s.post_id}`;
      }
      return null;
    }

    if (t === "space") {
      return `/community/spaces/${s.id}`;
    }

    if (t === "member") {
      return `/community/members/${s.id}`;
    }

    return null;
  }

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 items-center gap-2 px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/" className="mr-2 flex items-center gap-2.5 shrink-0">
          <Image
            src="/scholar-favicon-full.png"
            alt="The IO Circle"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline-block">
            The IO Circle
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex ml-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {searchOpen ? (
          <div className="relative">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-8 w-56 text-sm"
                autoFocus
              />
            </form>
            {searchQuery.trim().length > 3 && (
              <div className="absolute right-0 z-40 mt-1 w-72 rounded-md border bg-popover text-popover-foreground shadow-md">
                {(!suggestions || suggestions.length === 0) && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No results for &quot;{debouncedSearch.trim()}&quot;
                  </div>
                )}
                {suggestions && suggestions.length > 0 && (
                  <ul className="max-h-72 overflow-auto py-1 text-sm">
                    {suggestions.map((s) => {
                      const title =
                        s.display_title || s.highlighted_name || s.name || "Untitled";
                          const type = getSuggestionType(s);
                          const directHref = getSuggestionHref(s);
                      return (
                        <li key={`${type}-${s.id}`}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 hover:bg-muted"
                            onClick={() => {
                                  if (directHref) {
                                    router.push(directHref);
                                  } else {
                                    router.push(
                                      `/community/search?q=${encodeURIComponent(
                                        debouncedSearch.trim(),
                                      )}&type=${type || "all"}`,
                                    );
                                  }
                              setSearchOpen(false);
                            }}
                          >
                            <span className="truncate">{title}</span>
                            {type && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                {type}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4.5 w-4.5" />
          </Button>
        )}

        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative shrink-0 text-muted-foreground"
          >
            <Bell className="h-4.5 w-4.5" />
            {totalNotifs > 0 && (
              <Badge className="absolute -right-0.5 -top-0.5 h-4.5 min-w-4.5 rounded-full px-1 text-[10px] font-semibold">
                {totalNotifs > 99 ? "99+" : totalNotifs}
              </Badge>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="gap-2">
                <User className="h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/bookmarks" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Bookmarks
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loggingOut}
              className="gap-2 text-destructive focus:text-destructive"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex items-center gap-0.5 overflow-x-auto border-t px-4 py-1.5 lg:hidden">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

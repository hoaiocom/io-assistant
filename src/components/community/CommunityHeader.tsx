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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const navItems = [
  { label: "Community", href: "/community" },
  { label: "Courses", href: "/community/courses" },
  { label: "Chat", href: "/community/chat" },
  { label: "Events", href: "/community/events" },
  { label: "Leaderboard", href: "/community/leaderboard" },
  { label: "Members", href: "/community/members" },
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
      router.push("/community/login");
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

        <Link href="/community" className="mr-2 flex items-center gap-2.5 shrink-0">
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
              item.href === "/community"
                ? pathname === "/community"
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
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-8 w-48 text-sm"
              autoFocus
              onBlur={() => {
                if (!searchQuery) setSearchOpen(false);
              }}
            />
          </form>
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

        <Link href="/community/notifications">
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
              <Link href="/community/profile" className="gap-2">
                <User className="h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/community/bookmarks" className="gap-2">
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
            item.href === "/community"
              ? pathname === "/community"
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

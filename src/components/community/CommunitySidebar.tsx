"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import {
  Hash,
  Calendar,
  Image as ImageIcon,
  BookOpen,
  MessageCircle,
  Users,
  ChevronRight,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SpaceItem {
  id: number;
  name: string;
  slug: string;
  space_type: string;
  space_group_id: number | null;
  space_group_name?: string;
  emoji?: string | null;
  custom_emoji_url?: string | null;
  custom_emoji_dark_url?: string | null;
  is_private: boolean;
  is_member: boolean;
}

const spaceTypeIcons: Record<string, React.ElementType> = {
  basic: Hash,
  event: Calendar,
  image: ImageIcon,
  course: BookOpen,
  chat: MessageCircle,
  members: Users,
};

function SpaceIcon({ type, emoji }: { type: string; emoji?: string | null }) {
  if (emoji) return <span className="text-sm leading-none">{emoji}</span>;
  const Icon = spaceTypeIcons[type] || Hash;
  return <Icon className="h-4 w-4 shrink-0 opacity-60" />;
}

function SpaceBrandIcon({
  type,
  emoji,
  customEmojiUrl,
  customEmojiDarkUrl,
}: {
  type: string;
  emoji?: string | null;
  customEmojiUrl?: string | null;
  customEmojiDarkUrl?: string | null;
}) {
  if (customEmojiUrl) {
    return (
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        {/* Light */}
        <img
          src={customEmojiUrl}
          alt=""
          className={cn(
            "h-4 w-4 object-contain",
            customEmojiDarkUrl ? "dark:hidden" : "",
          )}
        />
        {/* Dark */}
        {customEmojiDarkUrl ? (
          <img
            src={customEmojiDarkUrl}
            alt=""
            className="hidden h-4 w-4 object-contain dark:block"
          />
        ) : null}
      </span>
    );
  }
  return <SpaceIcon type={type} emoji={emoji} />;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data, isLoading } = useSWR("/api/community/spaces", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const spaces: SpaceItem[] = Array.isArray(data) ? data : data?.records || data || [];

  const grouped = spaces.reduce<Record<string, SpaceItem[]>>((acc, space) => {
    const group = space.space_group_name || "Spaces";
    if (!acc[group]) acc[group] = [];
    acc[group].push(space);
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-3">
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/"
              ? "bg-primary/10 text-primary"
              : "text-foreground/70 hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60">
            <Home className="h-4 w-4 shrink-0 opacity-80" />
          </span>
          Home Feed
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
        {isLoading ? (
          <div className="space-y-4 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            ))}
          </div>
        ) : (
          Object.entries(grouped).map(([groupName, groupSpaces]) => (
            <div key={groupName} className="mb-4">
              <h3 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {groupName}
              </h3>
              <div className="space-y-0.5">
                {groupSpaces.map((space) => {
                  const href = `/spaces/${space.id}`;
                  const isActive = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={space.id}
                      href={href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-foreground/70 hover:bg-muted/70 hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          isActive ? "bg-primary/15" : "bg-muted/60 group-hover:bg-muted/70",
                        )}
                      >
                        <SpaceBrandIcon
                          type={space.space_type}
                          emoji={space.emoji}
                          customEmojiUrl={space.custom_emoji_url}
                          customEmojiDarkUrl={space.custom_emoji_dark_url}
                        />
                      </span>
                      <span className="truncate">{space.name}</span>
                      {space.is_private && !space.is_member && (
                        <ChevronRight className="ml-auto h-3 w-3 opacity-40" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface CommunitySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommunitySidebar({ open, onOpenChange }: CommunitySidebarProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r bg-card lg:block">
        <SidebarContent />
      </aside>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-72 p-0 bg-card">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

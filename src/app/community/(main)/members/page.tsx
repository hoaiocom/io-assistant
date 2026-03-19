"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Search,
  Users,
  MapPin,
  MessageCircle,
  UserPlus,
  SlidersHorizontal,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { MemberAvatarHoverCard } from "@/components/community/MemberAvatarHoverCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MemberItem {
  community_member_id?: number;
  id?: number;
  name: string;
  headline?: string;
  avatar_url?: string | null;
  email?: string;
  messaging_enabled?: boolean;
  can_receive_dm_from_current_member?: boolean;
  member_tags?: Array<{
    id: number;
    name: string;
    color?: string;
    is_public?: boolean;
    display_format?: string;
    emoji?: string;
  }>;
  roles?: { admin?: boolean; moderator?: boolean } | string[];
  profile_info?: { location?: string };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MemberCard({ member }: { member: MemberItem }) {
  const memberId = member.community_member_id || member.id;
  const initials = getInitials(member.name);
  const isAdmin =
    (Array.isArray(member.roles) && member.roles.includes("admin")) ||
    (!Array.isArray(member.roles) && member.roles?.admin);
  const isMod =
    (Array.isArray(member.roles) && member.roles.includes("moderator")) ||
    (!Array.isArray(member.roles) && member.roles?.moderator);
  const canMessage =
    member.can_receive_dm_from_current_member && member.messaging_enabled;
  const location = member.profile_info?.location;

  if (!memberId) return null;

  return (
    <div className="group flex flex-col items-center rounded-xl border bg-card p-5 text-center transition-shadow hover:shadow-sm">
      <Link href={`/community/members/${memberId}`} className="flex flex-col items-center">
        <MemberAvatarHoverCard
          memberId={memberId}
          memberName={member.name}
          avatarUrl={member.avatar_url || null}
        >
          <Avatar className="h-20 w-20 ring-2 ring-background transition-transform group-hover:scale-105">
            <AvatarImage src={member.avatar_url || undefined} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </MemberAvatarHoverCard>

        <h3 className="mt-3 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
          {member.name}
        </h3>
      </Link>

      {(isAdmin || isMod) && (
        <div className="mt-1 flex gap-1">
          {isAdmin && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Admin
            </Badge>
          )}
          {isMod && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Mod
            </Badge>
          )}
        </div>
      )}

      {member.headline && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {member.headline}
        </p>
      )}

      {location && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
        </p>
      )}

      {member.member_tags && member.member_tags.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-1">
          {member.member_tags
            .filter((t) => t.is_public !== false)
            .slice(0, 2)
            .map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-[10px] font-normal px-1.5 py-0"
              >
                {tag.emoji && <span className="mr-0.5">{tag.emoji}</span>}
                {tag.name}
              </Badge>
            ))}
        </div>
      )}

      <div className="mt-3 w-full border-t pt-3">
        {canMessage ? (
          <Link href="/chat" className="w-full">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8">
              <MessageCircle className="h-3.5 w-3.5" />
              Message
            </Button>
          </Link>
        ) : (
          <Link href={`/members/${memberId}`} className="w-full">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8">
              <UserPlus className="h-3.5 w-3.5" />
              View profile
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function MemberCardSkeleton() {
  return (
    <div className="flex flex-col items-center rounded-xl border bg-card p-5">
      <Skeleton className="h-20 w-20 rounded-full" />
      <Skeleton className="mt-3 h-4 w-24" />
      <Skeleton className="mt-2 h-3 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
      <Skeleton className="mt-4 h-8 w-full" />
    </div>
  );
}

export default function MembersPage() {
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchText, 400);

  const queryParams = new URLSearchParams({
    page: String(page),
    per_page: "24",
    sort,
  });
  if (debouncedSearch) queryParams.set("search_text", debouncedSearch);

  const { data: membersData, isLoading: membersLoading } = useSWR(
    `/api/community/members?${queryParams}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  );

  const { data: profile } = useSWR("/api/community/profile", fetcher, {
    revalidateOnFocus: false,
  });

  const members: MemberItem[] = membersData?.records || [];
  const totalCount = membersData?.total_record_count ?? membersData?.count ?? 0;
  const hasNextPage = membersData?.has_next_page || false;

  const myInitials = profile?.name
    ? getInitials(profile.name)
    : "?";

  return (
    <div className="flex gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Left sidebar - profile card & filters */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-6 space-y-4">
          {/* My profile card */}
          {profile && (
            <div className="rounded-xl border bg-card p-5 text-center">
              <Avatar className="mx-auto h-20 w-20 ring-2 ring-background">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {myInitials}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-3 text-sm font-semibold">{profile.name}</h3>
              {profile.headline && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {profile.headline}
                </p>
              )}
              {profile.profile_info?.location && (
                <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {profile.profile_info.location}
                </p>
              )}
              <Link href="/profile">
                <Button size="sm" className="mt-3 w-full text-xs">
                  View profile
                </Button>
              </Link>
            </div>
          )}

          {/* Find members filter card */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              Find members
            </h3>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search"
                  className="h-8 pl-8 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Sort by
                </label>
                <Select
                  value={sort}
                  onValueChange={(v) => {
                    setSort(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Recently joined</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="oldest">Oldest members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="min-w-0 flex-1">
        {/* Mobile search & filters */}
        <div className="mb-4 flex flex-col gap-3 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              placeholder="Search members..."
              className="pl-9"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-sm w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Recently joined</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="oldest">Oldest members</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">All members</h1>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-xs font-normal">
              {totalCount}
            </Badge>
          )}
        </div>

        {/* Members grid */}
        {membersLoading && members.length === 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <MemberCardSkeleton key={i} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-xl border bg-card px-6 py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {debouncedSearch
                ? `No members found matching "${debouncedSearch}"`
                : "No members found."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {members.map((member) => (
                <MemberCard
                  key={member.community_member_id || member.id}
                  member={member}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-center gap-3">
              {page > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page}
              </span>
              {hasNextPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MemberItem {
  community_member_id?: number;
  id?: number;
  name: string;
  headline?: string;
  avatar_url?: string | null;
  member_tags?: Array<{
    id: number;
    name: string;
    color?: string;
    is_public?: boolean;
  }>;
  roles?: { admin?: boolean; moderator?: boolean };
}

export default function MembersPage() {
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchText, 300);

  const { data, isLoading } = useSWR(
    debouncedSearch
      ? `/api/community/search?q=${encodeURIComponent(debouncedSearch)}&per_page=30`
      : `/api/community/spaces`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const membersList: MemberItem[] = debouncedSearch
    ? data?.records || []
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Members</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
          placeholder="Search members by name..."
          className="pl-9"
        />
      </div>

      {!debouncedSearch ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            Search for members by name to find people in the community.
          </p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : membersList.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-muted-foreground">
            No members found matching &quot;{debouncedSearch}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {membersList.map((member) => {
            const memberId = member.community_member_id || member.id;
            const initials = member.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Link
                key={memberId}
                href={`/community/members/${memberId}`}
                className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{member.name}</p>
                    {member.roles?.admin && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Admin
                      </Badge>
                    )}
                    {member.roles?.moderator && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Mod
                      </Badge>
                    )}
                  </div>
                  {member.headline && (
                    <p className="text-xs text-muted-foreground truncate">
                      {member.headline}
                    </p>
                  )}
                  {member.member_tags && member.member_tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {member.member_tags
                        .filter((t) => t.is_public !== false)
                        .slice(0, 3)
                        .map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-[10px] font-normal px-1.5 py-0"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

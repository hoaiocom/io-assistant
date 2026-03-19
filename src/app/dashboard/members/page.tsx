"use client";

import { useState } from "react";
import useSWR from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Users,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  UserPlus,
  Tag,
  ChevronLeft,
  ChevronRight,
  Mail,
  ExternalLink,
  X,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { safeFormat, safeTimeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";


function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface Member {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  last_seen_at: string | null;
  posts_count: number;
  comments_count: number;
  activity_score: number;
  member_tags: { id: number; name: string }[];
  profile_url: string;
  headline: string | null;
  first_name: string | null;
  last_name: string | null;
}

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  const params = new URLSearchParams({
    page: String(page),
    per_page: "20",
  });
  if (status !== "all") params.set("status", status);

  const apiUrl = debouncedSearch
    ? `/api/members/search?${params}&query=${encodeURIComponent(debouncedSearch)}`
    : `/api/members?${params}`;

  const { data, isLoading, mutate } = useSWR(apiUrl);

  const members: Member[] = data?.records ?? [];
  const hasNextPage = data?.has_next_page ?? false;
  const totalCount = data?.count ?? 0;

  const allSelected =
    members.length > 0 && members.every((m) => selectedIds.has(m.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.id)));
    }
  }

  function toggleOne(id: number) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, name: inviteName }),
      });
      if (!res.ok) throw new Error("Failed to invite member");
      toast.success("Invitation sent successfully");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      mutate();
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleDeactivate(memberId: number) {
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      if (!res.ok) throw new Error("Failed to deactivate");
      toast.success("Member deactivated");
      mutate();
    } catch {
      toast.error("Failed to deactivate member");
    }
  }

  async function handleBan(memberId: number) {
    try {
      const res = await fetch(`/api/members/${memberId}/ban`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to ban");
      toast.success("Member banned");
      mutate();
    } catch {
      toast.error("Failed to ban member");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your community members
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a new member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Name (optional)</Label>
                <Input
                  id="invite-name"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail}>
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="outline" size="sm">
            <Tag className="mr-1.5 h-3.5 w-3.5" />
            Tag
          </Button>
          <Button variant="outline" size="sm">
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            Add to Space
          </Button>
          <Button variant="outline" size="sm">
            <Ban className="mr-1.5 h-3.5 w-3.5" />
            Deactivate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Tags</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Last Seen
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                : members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(member.id)}
                          onCheckedChange={() => toggleOne(member.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={member.avatar_url ?? undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {initials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <button
                              onClick={() => setDetailMember(member)}
                              className="text-sm font-medium hover:underline truncate block"
                            >
                              {member.name}
                            </button>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.active ? "default" : "destructive"}
                          className={
                            member.active
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : ""
                          }
                        >
                          {member.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {member.member_tags?.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {(member.member_tags?.length ?? 0) > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{member.member_tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {safeFormat(member.created_at, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {member.last_seen_at
                          ? safeTimeAgo(member.last_seen_at)
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDetailMember(member)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeactivate(member.id)}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleBan(member.id)}
                              className="text-destructive"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Ban
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No members found
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalCount > 0
            ? `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, totalCount)} of ${totalCount}`
            : "No results"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Page {page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <Dialog
        open={detailMember !== null}
        onOpenChange={(open) => !open && setDetailMember(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
          </DialogHeader>
          {detailMember && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={detailMember.avatar_url ?? undefined} />
                  <AvatarFallback className="text-lg">
                    {initials(detailMember.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {detailMember.name}
                  </h3>
                  {detailMember.headline && (
                    <p className="text-sm text-muted-foreground">
                      {detailMember.headline}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {detailMember.email}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {detailMember.posts_count}
                  </p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {detailMember.comments_count}
                  </p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {detailMember.activity_score}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Activity Score
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={detailMember.active ? "default" : "destructive"}
                    className={
                      detailMember.active
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        : ""
                    }
                  >
                    {detailMember.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Joined</span>
                  <span>
                    {safeFormat(detailMember.created_at, "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Seen</span>
                  <span>
                    {detailMember.last_seen_at
                      ? safeTimeAgo(detailMember.last_seen_at)
                      : "Never"}
                  </span>
                </div>
              </div>

              {detailMember.member_tags?.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {detailMember.member_tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={detailMember.profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    View Profile
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

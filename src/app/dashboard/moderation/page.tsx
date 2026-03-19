"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Shield,
  Search,
  Check,
  X,
  Trash2,
  Plus,
  Eye,
  Copy,
  Edit,
  Users,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { safeTimeAgo } from "@/lib/utils";
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";


const statusColors: Record<string, string> = {
  inbox: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

interface FlaggedItem {
  id: number;
  content_id: number;
  content_type: string;
  status: string;
  reported_reason_type: string;
  reported_reason_body: string | null;
  created_at: string;
  flagged_contentable?: { name?: string; body?: string };
  reporter?: { name: string; email: string };
}

interface Segment {
  id: number;
  title: string;
  visible: boolean;
  audience_count: number;
  created_at: string;
}

interface SearchResult {
  id: number;
  type: string;
  name?: string;
  body?: string;
  email?: string;
}

export default function ModerationPage() {
  const [flaggedStatus, setFlaggedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("general");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [createSegmentOpen, setCreateSegmentOpen] = useState(false);
  const [newSegmentTitle, setNewSegmentTitle] = useState("");
  const [newSegmentVisible, setNewSegmentVisible] = useState(true);
  const [creatingSegment, setCreatingSegment] = useState(false);

  const params = new URLSearchParams();
  if (flaggedStatus !== "all") params.set("status", flaggedStatus);

  const {
    data: flagged,
    isLoading: loadingFlagged,
    mutate: mutateFlagged,
  } = useSWR(`/api/moderation/flagged?${params}`);

  const {
    data: segments,
    isLoading: loadingSegments,
    mutate: mutateSegments,
  } = useSWR("/api/moderation/segments");

  const flaggedItems: FlaggedItem[] = flagged?.records ?? flagged ?? [];
  const segmentList: Segment[] = segments?.records ?? segments ?? [];

  async function handleFlaggedAction(
    id: number,
    action: "approve" | "reject" | "delete"
  ) {
    try {
      const res = await fetch(`/api/moderation/flagged/${id}`, {
        method: action === "delete" ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body:
          action !== "delete"
            ? JSON.stringify({
                status: action === "approve" ? "approved" : "rejected",
              })
            : undefined,
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      toast.success(
        `Content ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "deleted"}`
      );
      mutateFlagged();
    } catch {
      toast.error(`Failed to ${action} content`);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const p = new URLSearchParams({
        query: searchQuery,
        type: searchType,
      });
      const res = await fetch(`/api/moderation/search?${p}`);
      const data = await res.json();
      setSearchResults(data?.records ?? data ?? []);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleCreateSegment() {
    if (!newSegmentTitle.trim()) return;
    setCreatingSegment(true);
    try {
      const res = await fetch("/api/moderation/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSegmentTitle,
          visible: newSegmentVisible,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Segment created");
      setCreateSegmentOpen(false);
      setNewSegmentTitle("");
      setNewSegmentVisible(true);
      mutateSegments();
    } catch {
      toast.error("Failed to create segment");
    } finally {
      setCreatingSegment(false);
    }
  }

  async function handleDeleteSegment(id: number) {
    try {
      const res = await fetch(`/api/moderation/segments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Segment deleted");
      mutateSegments();
    } catch {
      toast.error("Failed to delete segment");
    }
  }

  async function handleDuplicateSegment(id: number) {
    try {
      const res = await fetch(`/api/moderation/segments/${id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to duplicate");
      toast.success("Segment duplicated");
      mutateSegments();
    } catch {
      toast.error("Failed to duplicate segment");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review flagged content, search community, and manage segments
        </p>
      </div>

      <Tabs defaultValue="flagged">
        <TabsList>
          <TabsTrigger value="flagged">
            <Shield className="mr-1.5 h-4 w-4" />
            Flagged Content
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="mr-1.5 h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="segments">
            <Users className="mr-1.5 h-4 w-4" />
            Segments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged" className="space-y-4 mt-6">
          <div className="flex items-center gap-4">
            <Select value={flaggedStatus} onValueChange={setFlaggedStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="inbox">Inbox</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingFlagged ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : flaggedItems.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No flagged content</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={statusColors[item.status] ?? ""}
                          >
                            {item.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.content_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {safeTimeAgo(item.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">
                          {item.flagged_contentable?.name ??
                            item.flagged_contentable?.body?.slice(0, 150) ??
                            `Content #${item.content_id}`}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Reason:</span>{" "}
                          {item.reported_reason_type}
                          {item.reported_reason_body &&
                            ` — ${item.reported_reason_body}`}
                        </div>
                        {item.reporter && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Reported by:</span>{" "}
                            {item.reporter.name} ({item.reporter.email})
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleFlaggedAction(item.id, "approve")
                          }
                          title="Approve"
                        >
                          <Check className="h-4 w-4 text-emerald-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleFlaggedAction(item.id, "reject")
                          }
                          title="Reject"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleFlaggedAction(item.id, "delete")
                          }
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4 mt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search community..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="members">Members</SelectItem>
                <SelectItem value="posts">Posts</SelectItem>
                <SelectItem value="comments">Comments</SelectItem>
                <SelectItem value="spaces">Spaces</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <Card key={`${result.type}-${result.id}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Badge variant="outline" className="shrink-0">
                      {result.type}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {result.name ?? result.email ?? `#${result.id}`}
                      </p>
                      {result.body && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.body.slice(0, 120)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !searching && (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Search across your community content
                </p>
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Audience segments for targeted communication
            </p>
            <Dialog
              open={createSegmentOpen}
              onOpenChange={setCreateSegmentOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Segment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a new segment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="seg-title">Title</Label>
                    <Input
                      id="seg-title"
                      placeholder="Segment title"
                      value={newSegmentTitle}
                      onChange={(e) => setNewSegmentTitle(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="seg-visible"
                      checked={newSegmentVisible}
                      onCheckedChange={(v) => setNewSegmentVisible(v === true)}
                    />
                    <Label htmlFor="seg-visible">Visible</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateSegmentOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSegment}
                    disabled={creatingSegment || !newSegmentTitle.trim()}
                  >
                    {creatingSegment ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loadingSegments ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : segmentList.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No segments created yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {segmentList.map((seg) => (
                <Card key={seg.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{seg.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {seg.audience_count} members
                      </p>
                    </div>
                    <Badge
                      variant={seg.visible ? "default" : "secondary"}
                      className={
                        seg.visible
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : ""
                      }
                    >
                      {seg.visible ? "Visible" : "Hidden"}
                    </Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDuplicateSegment(seg.id)}
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteSegment(seg.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

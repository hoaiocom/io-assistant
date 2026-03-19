"use client";

import { useState } from "react";
import useSWR from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import {
  FileText,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Zap,
  MessageSquare,
  ThumbsUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";


interface Post {
  id: number;
  name: string;
  slug: string;
  url: string;
  status: string;
  body: string;
  space_id: number;
  space_name: string;
  user_name: string;
  user_avatar_url: string | null;
  comments_count: number;
  likes_count: number;
  published_at: string | null;
  created_at: string;
}

interface Space {
  id: number;
  name: string;
}

export default function PostsPage() {
  const [page, setPage] = useState(1);
  const [spaceId, setSpaceId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebounce(searchText);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newSpaceId, setNewSpaceId] = useState("");
  const [newStatus, setNewStatus] = useState("published");
  const [creating, setCreating] = useState(false);

  const params = new URLSearchParams({
    page: String(page),
    per_page: "20",
  });
  if (spaceId !== "all") params.set("space_id", spaceId);
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (debouncedSearch) params.set("search_text", debouncedSearch);

  const { data, isLoading, mutate } = useSWR(
    `/api/posts?${params}`
  );
  const { data: spaces } = useSWR("/api/spaces");

  const posts: Post[] = data?.records ?? [];
  const hasNextPage = data?.has_next_page ?? false;
  const totalCount = data?.count ?? 0;
  const spaceList: Space[] = spaces?.records ?? spaces ?? [];

  async function handleCreate() {
    if (!newTitle.trim() || !newSpaceId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTitle,
          body: newBody,
          space_id: Number(newSpaceId),
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      toast.success("Post created successfully");
      setCreateOpen(false);
      setNewTitle("");
      setNewBody("");
      setNewSpaceId("");
      setNewStatus("published");
      mutate();
    } catch {
      toast.error("Failed to create post");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(postId: number) {
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Post deleted");
      mutate();
    } catch {
      toast.error("Failed to delete post");
    }
  }

  async function handleSummarize(postId: number) {
    try {
      const res = await fetch(`/api/posts/${postId}/summarize`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to summarize");
      const result = await res.json();
      toast.success(result.summary ?? "Summary generated");
    } catch {
      toast.error("Failed to generate summary");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground mt-1">
            Manage community posts and content
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a new post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Space</Label>
                <Select value={newSpaceId} onValueChange={setNewSpaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a space" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaceList.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-title">Title</Label>
                <Input
                  id="post-title"
                  placeholder="Post title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-body">Body</Label>
                <textarea
                  id="post-body"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Write your post content..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim() || !newSpaceId}
              >
                {creating ? "Creating..." : "Create Post"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-9"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={spaceId}
          onValueChange={(v) => {
            setSpaceId(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Space" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Spaces</SelectItem>
            {spaceList.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Space</TableHead>
                <TableHead className="hidden md:table-cell">Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">
                  <MessageSquare className="h-4 w-4" />
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <ThumbsUp className="h-4 w-4" />
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Published
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-18" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                : posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[250px]">
                            {post.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {post.space_name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {post.user_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            post.status === "published"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            post.status === "published"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : ""
                          }
                        >
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {post.comments_count}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {post.likes_count}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {post.published_at
                          ? format(
                              new Date(post.published_at),
                              "MMM d, yyyy"
                            )
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a
                                href={post.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSummarize(post.id)}
                            >
                              <Zap className="mr-2 h-4 w-4" />
                              Get AI Summary
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(post.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && posts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No posts found
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
    </div>
  );
}

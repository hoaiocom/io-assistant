"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  FolderOpen,
  Plus,
  ExternalLink,
  Users,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


const SPACE_TYPES = [
  "all",
  "basic",
  "chat",
  "event",
  "course",
  "members",
  "image",
] as const;

const typeColors: Record<string, string> = {
  basic: "bg-blue-100 text-blue-700",
  chat: "bg-purple-100 text-purple-700",
  event: "bg-amber-100 text-amber-700",
  course: "bg-emerald-100 text-emerald-700",
  members: "bg-rose-100 text-rose-700",
  image: "bg-cyan-100 text-cyan-700",
};

interface Space {
  id: number;
  name: string;
  slug: string;
  url: string;
  space_type: string;
  is_private: boolean;
  post_ids: number[];
  topics: { id: number; name: string }[];
}

interface SpaceMember {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

export default function SpacesPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("basic");
  const [newPrivate, setNewPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [detailSpace, setDetailSpace] = useState<Space | null>(null);

  const { data, isLoading, mutate } = useSWR("/api/spaces");

  const { data: spaceMembers, isLoading: loadingMembers } = useSWR(
    detailSpace ? `/api/spaces/${detailSpace.id}/members` : null
  );

  const spaces: Space[] = data?.records ?? data ?? [];
  const filtered =
    typeFilter === "all"
      ? spaces
      : spaces.filter((s) => s.space_type === typeFilter);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          space_type: newType,
          is_private: newPrivate,
        }),
      });
      if (!res.ok) throw new Error("Failed to create space");
      toast.success("Space created successfully");
      setCreateOpen(false);
      setNewName("");
      setNewType("basic");
      setNewPrivate(false);
      mutate();
    } catch {
      toast.error("Failed to create space");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(spaceId: number) {
    try {
      const res = await fetch(`/api/spaces/${spaceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Space deleted");
      mutate();
    } catch {
      toast.error("Failed to delete space");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spaces</h1>
          <p className="text-muted-foreground mt-1">
            Manage community spaces and channels
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Space
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new space</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="space-name">Name</Label>
                <Input
                  id="space-name"
                  placeholder="Space name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="members">Members</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="space-private"
                  checked={newPrivate}
                  onCheckedChange={(v) => setNewPrivate(v === true)}
                />
                <Label htmlFor="space-private">Private space</Label>
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
                disabled={creating || !newName.trim()}
              >
                {creating ? "Creating..." : "Create Space"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList>
          {SPACE_TYPES.map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t === "all" ? "All" : t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-20 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No spaces found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((space) => (
            <Card
              key={space.id}
              className="group cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setDetailSpace(space)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{space.name}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={typeColors[space.space_type] ?? ""}
                  >
                    {space.space_type}
                  </Badge>
                </div>
                {space.is_private && (
                  <CardDescription className="text-xs">
                    Private
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{space.post_ids?.length ?? 0} posts</span>
                  <a
                    href={space.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={detailSpace !== null}
        onOpenChange={(open) => !open && setDetailSpace(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailSpace?.name}</DialogTitle>
          </DialogHeader>
          {detailSpace && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={typeColors[detailSpace.space_type] ?? ""}
                >
                  {detailSpace.space_type}
                </Badge>
                {detailSpace.is_private && (
                  <Badge variant="outline">Private</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Posts</p>
                  <p className="font-medium">
                    {detailSpace.post_ids?.length ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Topics</p>
                  <p className="font-medium">
                    {detailSpace.topics?.length ?? 0}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </h4>
                {loadingMembers ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                ) : (spaceMembers?.records ?? spaceMembers ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No members data
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(spaceMembers?.records ?? spaceMembers ?? []).map((m: SpaceMember) => (
                      <div key={m.id} className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={m.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {m.name?.[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{m.name}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {m.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    handleDelete(detailSpace.id);
                    setDetailSpace(null);
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={detailSpace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Open
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

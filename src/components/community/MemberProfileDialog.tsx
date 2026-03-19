"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { format, formatDistanceToNow } from "date-fns";
import {
  Mail,
  MapPin,
  Globe,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  FolderOpen,
  Award,
  Link as LinkIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function safeUrl(url?: string | null): string | undefined {
  if (!url || !url.trim()) return undefined;
  return url;
}

function toTitle(label: string) {
  return label
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeHttpUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  // Common case: "example.com" or "www.example.com"
  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(v)) return `https://${v}`;
  return null;
}

function isEmail(value: string): boolean {
  const v = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

type PublicProfile = {
  id: number;
  name: string;
  avatar_url?: string | null;
  large_avatar_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  email?: string | null;
  created_at?: string;
  last_seen_at?: string;
  last_seen_text?: string;
  profile_info?: Record<string, string | null>;
  custom_fields?: unknown;
  custom_profile_fields?: unknown;
  member_tags?: Array<{ id: number; name: string; is_public?: boolean }>;
  posts_count?: number;
  comments_count?: number;
  spaces_count?: number;
  gamification_stats?: {
    total_points?: number;
    current_level?: number;
    current_level_name?: string;
    points_to_next_level?: number;
    level_progress?: number;
  };
  roles?: { admin?: boolean; moderator?: boolean };
};

export function MemberProfileDialog({
  open,
  onOpenChange,
  memberId,
  initialName,
  initialAvatarUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: number;
  initialName?: string;
  initialAvatarUrl?: string | null;
}) {
  const { data: profile, isLoading } = useSWR<PublicProfile>(
    open ? `/api/community/members/${memberId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const name = profile?.name || initialName || "Member";
  const initials = useMemo(() => getInitials(name || "?"), [name]);
  const avatar = safeUrl(profile?.avatar_url || profile?.large_avatar_url || initialAvatarUrl);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return "";
    try {
      return format(new Date(profile.created_at), "MMMM d, yyyy");
    } catch {
      return "";
    }
  }, [profile?.created_at]);

  const lastSeen = useMemo(() => {
    if (profile?.last_seen_text) return profile.last_seen_text;
    if (!profile?.last_seen_at) return "";
    try {
      return formatDistanceToNow(new Date(profile.last_seen_at), { addSuffix: true });
    } catch {
      return "";
    }
  }, [profile?.last_seen_text, profile?.last_seen_at]);

  const tags = (profile?.member_tags || []).filter((t) => t.is_public !== false);

  const stats = profile?.gamification_stats;

  const customFieldEntries = useMemo(() => {
    const entries: Array<[string, string]> = [];

    const addRecord = (rec: unknown) => {
      if (!rec || typeof rec !== "object") return;
      for (const [k, v] of Object.entries(rec as Record<string, unknown>)) {
        if (v == null) continue;
        const str = typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
        if (!str.trim()) continue;
        entries.push([k, str]);
      }
    };

    // Per swagger, public_profile.profile_info includes website/location + social links.
    addRecord(profile?.profile_info);

    // Some Circle payloads can include custom fields under other keys.
    // We render any flat record-like objects as additional fields.
    addRecord(profile?.custom_fields);
    addRecord(profile?.custom_profile_fields);

    // Dedupe by key (keep first).
    const seen = new Set<string>();
    return entries.filter(([k]) => {
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [profile?.profile_info, profile?.custom_fields, profile?.custom_profile_fields]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
          {/* Left rail */}
          <div className="border-b md:border-b-0 md:border-r bg-gradient-to-b from-primary/5 to-transparent">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 ring-4 ring-background">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold">{name}</h2>

                {profile?.headline && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.headline}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  {profile?.roles?.admin && <Badge variant="secondary">Admin</Badge>}
                  {profile?.roles?.moderator && <Badge variant="secondary">Moderator</Badge>}
                </div>

                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                  {lastSeen && (
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Last seen {lastSeen}</span>
                    </div>
                  )}
                  {memberSince && (
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Member since {memberSince}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Button size="sm" className="rounded-full" disabled>
                    Edit
                  </Button>
                  <Button size="icon" variant="outline" className="rounded-full" asChild>
                    <a
                      href={`/community/members/${memberId}`}
                      aria-label="Open profile page"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="min-h-[520px]">
            <div className="p-6">
              <Tabs defaultValue="about">
                <TabsList className="mb-5">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="posts">Posts {profile?.posts_count ?? ""}</TabsTrigger>
                  <TabsTrigger value="comments">Comments {profile?.comments_count ?? ""}</TabsTrigger>
                  <TabsTrigger value="spaces">Spaces {profile?.spaces_count ?? ""}</TabsTrigger>
                  <TabsTrigger value="rewards">Rewards</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-0">
                  {isLoading && !profile ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {stats && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Activity score</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {stats.total_points != null ? `${stats.total_points} points` : "N/A"}
                            {stats.current_level != null ? ` · Level ${stats.current_level}` : ""}
                            {stats.current_level_name ? ` · ${stats.current_level_name}` : ""}
                          </p>
                        </div>
                      )}

                      {profile?.email && (
                        <Row icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
                      )}

                      {tags.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Tags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {tags.map((t) => (
                              <Badge key={t.id} variant="outline" className="text-xs">
                                {t.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile?.headline && (
                        <Row label="Headline" value={profile.headline} />
                      )}

                      {customFieldEntries.map(([k, v]) => (
                        <Row
                          key={k}
                          label={toTitle(k)}
                          value={v}
                          icon={
                            k === "website"
                              ? <Globe className="h-4 w-4" />
                              : k === "location"
                                ? <MapPin className="h-4 w-4" />
                                : undefined
                          }
                        />
                      ))}

                      {profile?.bio && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Your short bio</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {profile.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* For now: show placeholders but keep structure consistent with Circle */}
                <TabsContent value="posts" className="mt-0">
                  <EmptyTab label="Posts list is not exposed by current API routes yet." />
                </TabsContent>
                <TabsContent value="comments" className="mt-0">
                  <EmptyTab label="Comments list is not exposed by current API routes yet." />
                </TabsContent>
                <TabsContent value="spaces" className="mt-0">
                  <EmptyTab label="Spaces list is not exposed by current API routes yet." />
                </TabsContent>
                <TabsContent value="rewards" className="mt-0">
                  <EmptyTab label="Rewards are not exposed by current API routes yet." />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  const href = normalizeHttpUrl(value);
  const isLink = href != null;
  const isMail = !isLink && isEmail(value);
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <span className="font-medium">{label}</span>
      </div>
      {isLink ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 underline underline-offset-2 hover:text-blue-700"
        >
          {value}
        </a>
      ) : isMail ? (
        <a
          href={`mailto:${value.trim()}`}
          className="text-sm text-blue-600 underline underline-offset-2 hover:text-blue-700"
        >
          {value}
        </a>
      ) : (
        <p className={cn("text-sm")}>{value}</p>
      )}
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
      {label}
    </div>
  );
}


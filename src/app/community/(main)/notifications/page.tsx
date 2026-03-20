"use client";

import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { formatDistanceToNow } from "date-fns";
import { Archive, Bell, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NotificationItem {
  id: number;
  created_at: string;
  read_at: string | null;
  action: string;
  display_action: string;
  actor_name: string;
  actor_image: string | null;
  notifiable_title: string;
  space_title: string;
  action_web_url: string;
  notification_text_structure?: string[];
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [hasResetCount, setHasResetCount] = useState(false);
  const { mutate: mutateGlobal } = useSWRConfig();
  const { data, isLoading, mutate } = useSWR(
    `/api/community/notifications?page=${page}&per_page=30`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const notifications: NotificationItem[] = data?.records || [];
  const hasNextPage = data?.has_next_page || false;

  useEffect(() => {
    async function resetBadgeCount() {
      if (isLoading || hasResetCount || page !== 1) return;
      setHasResetCount(true);
      try {
        await fetch("/api/community/notifications/reset-count", { method: "POST" });
        mutateGlobal("/api/community/notifications?count=true");
      } catch {
        // silent
      }
    }
    resetBadgeCount();
  }, [hasResetCount, isLoading, mutateGlobal, page]);

  async function handleMarkAllRead() {
    try {
      await fetch("/api/community/notifications", { method: "POST" });
      mutate();
      await fetch("/api/community/notifications/reset-count", { method: "POST" });
      mutateGlobal("/api/community/notifications?count=true");
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  }

  async function handleMarkRead(id: number) {
    const previousData = data;
    mutate(
      (current) => {
        if (!current?.records) return current;
        return {
          ...current,
          records: current.records.map((n: NotificationItem) =>
            n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n,
          ),
        };
      },
      { revalidate: false },
    );
    try {
      await fetch(`/api/community/notifications/${id}/read`, { method: "POST" });
      mutate();
      await fetch("/api/community/notifications/reset-count", { method: "POST" });
      mutateGlobal("/api/community/notifications?count=true");
    } catch {
      mutate(previousData, { revalidate: false });
    }
  }

  async function handleArchive(id: number) {
    const previousData = data;
    mutate(
      (current) => {
        if (!current?.records) return current;
        return {
          ...current,
          records: current.records.filter((n: NotificationItem) => n.id !== id),
        };
      },
      { revalidate: false },
    );
    try {
      await fetch(`/api/community/notifications/${id}/archive`, { method: "POST" });
      mutate();
      await fetch("/api/community/notifications/reset-count", { method: "POST" });
      mutateGlobal("/api/community/notifications?count=true");
      toast.success("Notification archived");
    } catch {
      mutate(previousData, { revalidate: false });
      toast.error("Failed to archive notification");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-4">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <Bell className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {notifications.map((notif) => {
              const timeAgo = formatDistanceToNow(new Date(notif.created_at), {
                addSuffix: true,
              });
              const isUnread = !notif.read_at;
              const initials = notif.actor_name
                ? notif.actor_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "?";

              return (
                <div
                  key={notif.id}
                  className={cn(
                    "group flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer hover:bg-muted/50",
                    isUnread && "bg-primary/[0.03] border-primary/20",
                  )}
                  onClick={() => {
                    if (isUnread) handleMarkRead(notif.id);
                  }}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={notif.actor_image || undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">{notif.actor_name}</span>{" "}
                      <span className="text-muted-foreground">
                        {notif.display_action || notif.action}
                      </span>{" "}
                      {notif.notifiable_title && (
                        <span className="font-medium">{notif.notifiable_title}</span>
                      )}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{timeAgo}</span>
                      {notif.space_title && (
                        <>
                          <span>·</span>
                          <span>{notif.space_title}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="ml-1 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(notif.id);
                      }}
                      aria-label="Archive notification"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                    {isUnread && <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            {page > 1 && (
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
            )}
            {hasNextPage && (
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
                Load more
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

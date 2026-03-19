"use client";

import useSWR from "swr";
import { formatDistanceToNow, format } from "date-fns";
import {
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EventPost {
  id: number;
  name?: string;
  display_title?: string;
  slug: string;
  body?: string;
  cover_image?: string | null;
  cover_image_url?: string | null;
  created_at: string;
  space_id?: number;
  event_setting_attributes?: {
    starts_at?: string;
    ends_at?: string;
    in_person_location?: string | null;
    virtual_location_url?: string;
    location_type?: string;
    rsvp_count?: number;
    rsvp_limit?: number | null;
    rsvp_disabled?: boolean;
    duration_in_seconds?: number;
  };
  event_type?: string;
  rsvped_event?: boolean;
  community_member?: {
    name: string;
    avatar_url?: string | null;
    community_member_id?: number;
  };
  event_attendees?: {
    records?: Array<{ id: number; name: string; avatar_url?: string | null }>;
    count?: number;
  };
}

export default function EventsPage() {
  const { data: spacesData } = useSWR("/api/community/spaces", fetcher, {
    revalidateOnFocus: false,
  });

  const eventSpaces = (
    Array.isArray(spacesData)
      ? spacesData
      : spacesData?.records || []
  ).filter((s: { space_type: string }) => s.space_type === "event");

  const firstEventSpaceId = eventSpaces[0]?.id;

  const { data: postsData, isLoading, mutate } = useSWR(
    firstEventSpaceId
      ? `/api/community/spaces/${firstEventSpaceId}/posts?per_page=50`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const events: EventPost[] = postsData?.records || [];

  const upcomingEvents = events
    .filter((e) => {
      const startsAt = e.event_setting_attributes?.starts_at;
      return startsAt && new Date(startsAt) > new Date();
    })
    .sort((a, b) => {
      const aDate = a.event_setting_attributes?.starts_at || "";
      const bDate = b.event_setting_attributes?.starts_at || "";
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });

  const pastEvents = events
    .filter((e) => {
      const startsAt = e.event_setting_attributes?.starts_at;
      return !startsAt || new Date(startsAt) <= new Date();
    })
    .sort((a, b) => {
      const aDate = a.event_setting_attributes?.starts_at || a.created_at;
      const bDate = b.event_setting_attributes?.starts_at || b.created_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  async function handleRsvp(eventId: number) {
    try {
      const res = await fetch(`/api/community/events/${eventId}/rsvp`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
      mutate();
      toast.success("RSVP confirmed!");
    } catch {
      toast.error("Failed to RSVP");
    }
  }

  function EventCard({ event }: { event: EventPost }) {
    const settings = event.event_setting_attributes;
    const title = event.display_title || event.name || "Untitled Event";
    const startsAt = settings?.starts_at ? new Date(settings.starts_at) : null;
    const isVirtual = settings?.location_type === "virtual";
    const attendeeCount = event.event_attendees?.count || settings?.rsvp_count || 0;
    const cover = event.cover_image || event.cover_image_url;

    return (
      <div className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm">
        {cover && (
          <div className="relative aspect-[2.5/1] overflow-hidden">
            <img src={cover} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {startsAt && (
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(startsAt, "EEEE, MMM d 'at' h:mm a")}
                </div>
              )}
              <h3 className="text-base font-semibold leading-snug">{title}</h3>
            </div>
            {startsAt && (
              <div className="shrink-0 rounded-lg border bg-muted/30 px-3 py-1.5 text-center">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {format(startsAt, "MMM")}
                </p>
                <p className="text-lg font-bold leading-none">
                  {format(startsAt, "d")}
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {isVirtual ? (
              <span className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" />
                Virtual event
              </span>
            ) : settings?.in_person_location ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {settings.in_person_location}
              </span>
            ) : null}
            {settings?.duration_in_seconds && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {Math.round(settings.duration_in_seconds / 60)} min
              </span>
            )}
            {attendeeCount > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {attendeeCount} attending
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            {event.rsvped_event ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                You&apos;re going
              </Badge>
            ) : settings?.rsvp_disabled ? (
              <Badge variant="outline">RSVP closed</Badge>
            ) : (
              <Button size="sm" onClick={() => handleRsvp(event.id)}>
                RSVP
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Events</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-6 w-64 mb-3" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No events scheduled yet.</p>
        </div>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Upcoming
              </h2>
              <div className="space-y-4">
                {upcomingEvents.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Past events
              </h2>
              <div className="space-y-4">
                {pastEvents.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

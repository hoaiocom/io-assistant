"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Video,
  Users,
  Monitor,
  ChevronDown,
  CheckCircle2,
  MoreHorizontal,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface EventTopic {
  id: number;
  name: string;
  slug: string;
}

interface EventSpace {
  id: number;
  name: string;
  slug: string;
  space_type: string;
  topics_count?: number;
}

interface EventAuthor {
  id?: number;
  community_member_id?: number;
  name: string;
  avatar_url?: string | null;
}

interface EventSettings {
  starts_at?: string;
  ends_at?: string;
  in_person_location?: string | null;
  virtual_location_url?: string;
  location_type?: string;
  rsvp_count?: number;
  rsvp_limit?: number | null;
  rsvp_disabled?: boolean;
  duration_in_seconds?: number;
  hide_attendees?: boolean;
}

interface EventPost {
  id: number;
  name?: string;
  display_title?: string;
  slug: string;
  body?: { html?: string } | string | null;
  body_plain_text?: string;
  body_plain_text_without_attachments?: string;
  cover_image?: string | null;
  cover_image_url?: string | null;
  cardview_image?: string | null;
  created_at: string;
  space_id?: number;
  space?: { id: number; slug: string; name: string };
  event_setting_attributes?: EventSettings;
  event_settings_attributes?: EventSettings;
  event_type?: string;
  rsvped_event?: boolean;
  rsvp_status?: string | null;
  author?: EventAuthor;
  community_member?: EventAuthor;
  event_attendees?: {
    records?: Array<{ id: number; name: string; avatar_url?: string | null }>;
    count?: number;
  };
  topics?: EventTopic[];
}

function getEventSettings(event: EventPost): EventSettings | undefined {
  return event.event_setting_attributes || event.event_settings_attributes;
}

interface FilterItem {
  id: string;
  name: string;
}

const VISIBLE_FILTER_COUNT = 3;

function getLocationLabel(locationType?: string) {
  if (!locationType) return null;
  if (locationType === "virtual") return "Live Stream";
  if (locationType === "live_room") return "Live room";
  if (locationType === "in_person") return null;
  return locationType;
}

function getLocationIcon(locationType?: string) {
  if (locationType === "live_room") return Monitor;
  if (locationType === "virtual") return Video;
  if (locationType === "in_person") return MapPin;
  return Video;
}

function formatDateRange(startsAt: Date, endsAt?: Date) {
  const dayPart = format(startsAt, "EEEE, MMM d");
  const startTime = format(startsAt, "h:mm");
  if (endsAt) {
    const endTime = format(endsAt, "h:mm a");
    return `${dayPart}, ${startTime}\u2009\u2013\u2009${endTime}`;
  }
  return `${dayPart}, ${format(startsAt, "h:mm a")}`;
}

function getTimeUntilLabel(startsAt: Date) {
  const now = new Date();
  const diff = startsAt.getTime() - now.getTime();
  if (diff < 0) return null;
  return `Starts ${formatDistanceToNow(startsAt, { addSuffix: true })}`;
}

function groupByMonth(events: EventPost[]) {
  const groups: { label: string; events: EventPost[] }[] = [];
  for (const event of events) {
    const startsAt = getEventSettings(event)?.starts_at;
    const date = startsAt ? new Date(startsAt) : new Date(event.created_at);
    const label = format(date, "MMMM yyyy");
    const existing = groups.find((g) => g.label === label);
    if (existing) {
      existing.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
  }
  return groups;
}

function RsvpButton({
  event,
  onRsvp,
}: {
  event: EventPost;
  onRsvp: (id: number) => void;
}) {
  const isGoing = event.rsvped_event || event.rsvp_status === "yes";
  const disabled = getEventSettings(event)?.rsvp_disabled;

  if (isGoing) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-950/60">
            <CheckCircle2 className="h-4 w-4" />
            Going
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem disabled className="gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Going
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            Not going
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (disabled) {
    return (
      <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground">
        RSVP closed
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="rounded-full"
      onClick={() => onRsvp(event.id)}
    >
      RSVP
    </Button>
  );
}

function FeaturedEventCard({
  event,
  onRsvp,
}: {
  event: EventPost;
  onRsvp: (id: number) => void;
}) {
  const eventHref = `/community/spaces/${event.space?.id || event.space_id || ""}/posts/${event.id}`;
  const settings = getEventSettings(event);
  const title = event.display_title || event.name || "Untitled Event";
  const startsAt = settings?.starts_at ? new Date(settings.starts_at) : null;
  const endsAt = settings?.ends_at ? new Date(settings.ends_at) : null;
  const cover = event.cover_image || event.cover_image_url;
  const attendeeCount =
    event.event_attendees?.count || settings?.rsvp_count || 0;
  const author = event.author || event.community_member;
  const locationType = settings?.location_type;
  const locationLabel =
    getLocationLabel(locationType) ||
    settings?.in_person_location ||
    null;
  const LocationIcon = getLocationIcon(locationType);

  const description =
    event.body_plain_text_without_attachments ||
    event.body_plain_text ||
    (typeof event.body === "string" ? event.body : null);

  const timeLabel = startsAt ? getTimeUntilLabel(startsAt) : null;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {cover && (
        <Link href={eventHref} className="block">
          <div className="relative aspect-[2.5/1] overflow-hidden">
            <img src={cover} alt="" className="h-full w-full object-cover" />
          </div>
        </Link>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <Link href={eventHref} className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-snug sm:text-lg hover:underline">
              {title}
            </h3>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <RsvpButton event={event} onRsvp={onRsvp} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem>Share event</DropdownMenuItem>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {startsAt && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            {formatDateRange(startsAt, endsAt ?? undefined)}
          </div>
        )}

        {description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {timeLabel && (
            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400">
              {timeLabel}
            </span>
          )}
          {locationLabel && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
              <LocationIcon className="h-3 w-3" />
              {locationLabel}
            </span>
          )}
          {author?.name && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {author.name}
            </span>
          )}
          {attendeeCount > 0 && !settings?.hide_attendees && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {attendeeCount} Attendee{attendeeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CompactEventCard({
  event,
  onRsvp,
}: {
  event: EventPost;
  onRsvp: (id: number) => void;
}) {
  const eventHref = `/community/spaces/${event.space?.id || event.space_id || ""}/posts/${event.id}`;
  const settings = getEventSettings(event);
  const title = event.display_title || event.name || "Untitled Event";
  const startsAt = settings?.starts_at ? new Date(settings.starts_at) : null;
  const endsAt = settings?.ends_at ? new Date(settings.ends_at) : null;
  const cover =
    event.cover_image || event.cover_image_url || event.cardview_image;
  const locationType = settings?.location_type;
  const locationLabel =
    getLocationLabel(locationType) ||
    settings?.in_person_location ||
    null;
  const LocationIcon = getLocationIcon(locationType);

  return (
    <div className="flex gap-4 rounded-xl border bg-card p-3 transition-shadow hover:shadow-sm sm:p-4">
      {cover && (
        <Link
          href={eventHref}
          className="h-20 w-20 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24"
        >
          <img src={cover} alt="" className="h-full w-full object-cover" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={eventHref} className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold leading-snug hover:underline">
              {title}
            </h3>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <RsvpButton event={event} onRsvp={onRsvp} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem>Share event</DropdownMenuItem>
                <DropdownMenuItem>Copy link</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {startsAt && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {formatDateRange(startsAt, endsAt ?? undefined)}
          </div>
        )}
        {locationLabel && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <LocationIcon className="h-3.5 w-3.5 shrink-0" />
            {locationLabel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [timeFilter, setTimeFilter] = useState<"upcoming" | "past">(
    "upcoming",
  );
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const { data: spacesData } = useSWR("/api/community/spaces", fetcher, {
    revalidateOnFocus: false,
  });

  const eventSpaces: EventSpace[] = useMemo(() => {
    const all = Array.isArray(spacesData)
      ? spacesData
      : spacesData?.records || [];
    return all.filter(
      (s: { space_type: string }) => s.space_type === "event",
    );
  }, [spacesData]);

  const hasMultipleSpaces = eventSpaces.length > 1;

  // Fetch events from Headless community_events (per swagger).
  const {
    data: postsData,
    isLoading: postsLoading,
    mutate,
  } = useSWR(
    `/api/community/events?per_page=50&past_events=${timeFilter === "past" ? "true" : "false"}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const isLoading = !spacesData || postsLoading;

  const allEvents: EventPost[] = useMemo(
    () => postsData?.records || [],
    [postsData],
  );

  // Build type filter items: use space names when multiple spaces, topics otherwise
  const filterItems: FilterItem[] = useMemo(() => {
    if (hasMultipleSpaces) {
      return eventSpaces.map((s) => ({
        id: `space:${s.id}`,
        name: s.name,
      }));
    }
    const map = new Map<number, EventTopic>();
    for (const e of allEvents) {
      for (const t of e.topics || []) {
        if (!map.has(t.id)) map.set(t.id, t);
      }
    }
    return Array.from(map.values()).map((t) => ({
      id: `topic:${t.id}`,
      name: t.name,
    }));
  }, [allEvents, eventSpaces, hasMultipleSpaces]);

  const visibleFilters = filterItems.slice(0, VISIBLE_FILTER_COUNT);
  const overflowFilters = filterItems.slice(VISIBLE_FILTER_COUNT);

  // Apply type filter (space-based or topic-based)
  const filteredEvents = useMemo(() => {
    if (selectedFilter === "all") return allEvents;
    if (selectedFilter.startsWith("space:")) {
      const spaceId = Number(selectedFilter.split(":")[1]);
      return allEvents.filter(
        (e) => e.space_id === spaceId || e.space?.id === spaceId,
      );
    }
    if (selectedFilter.startsWith("topic:")) {
      const topicId = Number(selectedFilter.split(":")[1]);
      return allEvents.filter((e) =>
        e.topics?.some((t) => t.id === topicId),
      );
    }
    return allEvents;
  }, [allEvents, selectedFilter]);

  const upcomingEvents = useMemo(() => {
    const list = filteredEvents.slice();
    return list.sort((a, b) => {
      const aD = getEventSettings(a)?.starts_at || "";
      const bD = getEventSettings(b)?.starts_at || "";
      return new Date(aD).getTime() - new Date(bD).getTime();
    });
  }, [filteredEvents]);

  const pastEvents = useMemo(() => {
    const list = filteredEvents.slice();
    return list.sort((a, b) => {
      const aD = getEventSettings(a)?.starts_at || a.created_at;
      const bD = getEventSettings(b)?.starts_at || b.created_at;
      return new Date(bD).getTime() - new Date(aD).getTime();
    });
  }, [filteredEvents]);

  // Keep a sane default, but never force-switch after user choice.
  useEffect(() => {
    if (!isLoading && timeFilter === "upcoming" && upcomingEvents.length === 0) {
      // If there are genuinely no upcoming events, show past.
      setTimeFilter("past");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const displayEvents =
    timeFilter === "upcoming" ? upcomingEvents : pastEvents;

  // Upcoming: featured "next event" + remaining grouped by month
  // Past: all events grouped by month (newest first)
  const nextEvent =
    timeFilter === "upcoming" && upcomingEvents.length > 0
      ? upcomingEvents[0]
      : undefined;
  const remainingEvents =
    timeFilter === "upcoming" ? upcomingEvents.slice(1) : pastEvents;
  const monthGroups = groupByMonth(remainingEvents);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
              {timeFilter === "upcoming" ? "Upcoming" : "Past"}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            <DropdownMenuItem onClick={() => setTimeFilter("upcoming")}>
              Upcoming
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeFilter("past")}>
              Past
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            selectedFilter === "all"
              ? "border-foreground bg-foreground text-background"
              : "hover:bg-muted",
          )}
          onClick={() => setSelectedFilter("all")}
        >
          All
        </button>

        {visibleFilters.map((item) => (
          <button
            key={item.id}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              selectedFilter === item.id
                ? "border-foreground bg-foreground text-background"
                : "hover:bg-muted",
            )}
            onClick={() => setSelectedFilter(item.id)}
          >
            {item.name}
          </button>
        ))}

        {overflowFilters.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
                More
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {overflowFilters.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => setSelectedFilter(item.id)}
                >
                  {item.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {timeFilter === "upcoming"
              ? "No upcoming events."
              : "No past events."}
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming: featured "Next event" card */}
          {nextEvent && (
            <section className="mb-8">
              <h2 className="mb-3 text-base font-semibold">Next event</h2>
              <FeaturedEventCard event={nextEvent} onRsvp={handleRsvp} />
            </section>
          )}

          {/* Month-grouped events */}
          {monthGroups.map((group) => (
            <section key={group.label} className="mb-8">
              <h2 className="mb-3 text-base font-semibold">{group.label}</h2>
              <div className="space-y-3">
                {group.events.map((event) => (
                  <CompactEventCard
                    key={event.id}
                    event={event}
                    onRsvp={handleRsvp}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

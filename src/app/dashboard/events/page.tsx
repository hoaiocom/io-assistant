"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  ExternalLink,
  X,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";


interface EventItem {
  id: number;
  name: string;
  slug: string;
  url: string;
  space_id: number;
  body: string;
  status: string;
  event_setting_attributes: {
    start_date?: string;
    end_date?: string;
    location?: string;
    location_type?: string;
    virtual_location_url?: string;
  };
  created_at: string;
}

interface Attendee {
  id: number;
  community_member_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  rsvp_status: string;
}

interface Space {
  id: number;
  name: string;
}

export default function EventsPage() {
  const [spaceFilter, setSpaceFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSpaceId, setNewSpaceId] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [creating, setCreating] = useState(false);
  const [attendeesEvent, setAttendeesEvent] = useState<EventItem | null>(null);
  const [addAttendeeEmail, setAddAttendeeEmail] = useState("");

  const { data: events, isLoading, mutate } = useSWR("/api/events");
  const { data: spaces } = useSWR("/api/spaces");
  const {
    data: attendees,
    isLoading: loadingAttendees,
    mutate: mutateAttendees,
  } = useSWR(
    attendeesEvent ? `/api/events/${attendeesEvent.id}/attendees` : null
  );

  const eventList: EventItem[] = events?.records ?? events ?? [];
  const spaceList: Space[] = spaces?.records ?? spaces ?? [];
  const filtered =
    spaceFilter === "all"
      ? eventList
      : eventList.filter((e) => String(e.space_id) === spaceFilter);
  const attendeeList: Attendee[] = attendees?.records ?? attendees ?? [];

  const spaceMap = new Map(spaceList.map((s) => [s.id, s.name]));

  async function handleCreate() {
    if (!newName.trim() || !newSpaceId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          space_id: Number(newSpaceId),
          body: newDescription,
          event_setting_attributes: {
            start_date: newStartDate || undefined,
            end_date: newEndDate || undefined,
            location: newLocation || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to create event");
      toast.success("Event created successfully");
      setCreateOpen(false);
      setNewName("");
      setNewSpaceId("");
      setNewDescription("");
      setNewStartDate("");
      setNewEndDate("");
      setNewLocation("");
      mutate();
    } catch {
      toast.error("Failed to create event");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(eventId: number) {
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Event deleted");
      mutate();
    } catch {
      toast.error("Failed to delete event");
    }
  }

  async function handleAddAttendee() {
    if (!attendeesEvent || !addAttendeeEmail) return;
    try {
      const res = await fetch(
        `/api/events/${attendeesEvent.id}/attendees`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: addAttendeeEmail }),
        }
      );
      if (!res.ok) throw new Error("Failed to add attendee");
      toast.success("Attendee added");
      setAddAttendeeEmail("");
      mutateAttendees();
    } catch {
      toast.error("Failed to add attendee");
    }
  }

  async function handleRemoveAttendee(attendeeId: number) {
    if (!attendeesEvent) return;
    try {
      const res = await fetch(
        `/api/events/${attendeesEvent.id}/attendees/${attendeeId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove");
      toast.success("Attendee removed");
      mutateAttendees();
    } catch {
      toast.error("Failed to remove attendee");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage community events and gatherings
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a new event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Name</Label>
                <Input
                  id="event-name"
                  placeholder="Event name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
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
                <Label htmlFor="event-desc">Description</Label>
                <textarea
                  id="event-desc"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Event description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-start">Start Date</Label>
                  <Input
                    id="event-start"
                    type="datetime-local"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-end">End Date</Label>
                  <Input
                    id="event-end"
                    type="datetime-local"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-location">Location</Label>
                <Input
                  id="event-location"
                  placeholder="Event location"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                />
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
                disabled={creating || !newName.trim() || !newSpaceId}
              >
                {creating ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={spaceFilter}
          onValueChange={setSpaceFilter}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by space" />
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
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28 mt-2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No events found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => {
            const settings = event.event_setting_attributes;
            return (
              <Card key={event.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{event.name}</CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {event.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {spaceMap.get(event.space_id) ?? "Unknown space"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {settings?.start_date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {format(
                          new Date(settings.start_date),
                          "MMM d, yyyy h:mm a"
                        )}
                      </span>
                    </div>
                  )}
                  {settings?.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="truncate">{settings.location}</span>
                    </div>
                  )}
                </CardContent>
                <div className="px-6 pb-4 pt-0">
                  <Separator className="mb-3" />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAttendeesEvent(event)}
                    >
                      <Users className="mr-1.5 h-3.5 w-3.5" />
                      Attendees
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={attendeesEvent !== null}
        onOpenChange={(open) => !open && setAttendeesEvent(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Attendees — {attendeesEvent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                value={addAttendeeEmail}
                onChange={(e) => setAddAttendeeEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleAddAttendee}
                disabled={!addAttendeeEmail}
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <Separator />
            {loadingAttendees ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            ) : attendeeList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No attendees yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attendeeList.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 py-1"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={a.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {a.name?.[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {a.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.email}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {a.rsvp_status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleRemoveAttendee(a.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

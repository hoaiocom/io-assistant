import { circleAdmin } from "./client";
import type { Event, EventAttendee, PaginatedResponse } from "./types";

export async function listEvents(params?: {
  page?: number;
  per_page?: number;
  space_id?: number;
}) {
  return circleAdmin.get<PaginatedResponse<Event>>(
    "events",
    params as Record<string, string | number>,
  );
}

export async function getEvent(id: number) {
  return circleAdmin.get<Event>(`events/${id}`);
}

export async function createEvent(data: {
  name: string;
  space_id: number;
  body?: string;
  event_setting_attributes?: Record<string, unknown>;
}) {
  return circleAdmin.post<Event>("events", { event: data });
}

export async function updateEvent(id: number, data: Partial<Event>) {
  return circleAdmin.put<Event>(`events/${id}`, { event: data });
}

export async function deleteEvent(id: number) {
  return circleAdmin.delete(`events/${id}`);
}

export async function duplicateEvent(spaceId: number, eventId: number, targetSpaceId: number) {
  return circleAdmin.post<Event>(
    `spaces/${spaceId}/events/${eventId}/duplicate`,
    { space_id: targetSpaceId },
  );
}

// Event Attendees
export async function listEventAttendees(eventId: number, params?: {
  page?: number;
  per_page?: number;
}) {
  return circleAdmin.get<PaginatedResponse<EventAttendee>>(
    "event_attendees",
    { event_id: eventId, ...params } as Record<string, string | number>,
  );
}

export async function addEventAttendee(data: {
  event_id: number;
  member_email: string;
}) {
  return circleAdmin.post<EventAttendee>("event_attendees", data);
}

export async function removeEventAttendee(data: {
  event_id: number;
  member_email: string;
}) {
  return circleAdmin.delete("event_attendees", data as unknown as Record<string, string | number>);
}

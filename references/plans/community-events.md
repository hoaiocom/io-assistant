## Community UI plan: Events

### Current UI implementation (already in repo)

- **Events index page**: `src/app/community/(main)/events/page.tsx`
  - Loads events via `GET /api/community/events` (Headless `GET /community_events`)
  - RSVP via `POST /api/community/events/[id]/rsvp` (Headless `POST /events/{event_id}/event_attendees`)
  - Filters by upcoming/past; filters by space or topic
- **Event detail**
  - Implemented as a post detail route: `/community/spaces/[spaceId]/posts/[eventId]` rendered by `src/app/community/(main)/spaces/[id]/posts/[postId]/page.tsx`

### Relevant Headless Member API (from swagger)

- **Event listing**
  - `GET /api/headless/v1/community_events`
- **Event attendees / RSVP**
  - `GET /api/headless/v1/events/{event_id}/event_attendees`
  - `POST /api/headless/v1/events/{event_id}/event_attendees`
- **Recurring events (space-scoped)**
  - `GET /api/headless/v1/spaces/{space_id}/events/{event_id}/recurring_events` (**not used in UI**)
  - `POST /api/headless/v1/spaces/{space_id}/events/{event_id}/recurring_events/rsvp` (**not used in UI**)
- **Live streams**
  - `POST /api/headless/v1/live_streams/rooms` (**not used in UI**; likely used for live event experiences)

### Gaps (API capabilities not yet used)

- **Recurring events**
  - show instances of a recurring event (schedule, next occurrences)
  - allow RSVP to a specific occurrence
- **Attendees view**
  - surface attendee list (respecting `hide_attendees`) on event detail
  - show RSVP count / limit and “spots left”
- **Live stream room**
  - when event is `virtual` or `live_room`, offer the “Join live” CTA that creates/opens a live stream room when supported

### UI/UX improvements (best-practice)

- **Event detail**
  - Add an event sidebar card:
    - date/time (already shown)
    - location (already shown)
    - RSVP CTA with status management (“Going”, “Not going”)
    - attendee preview + “View all attendees”
    - recurring instances selector when applicable
- **Calendar affordances**
  - Add “Add to calendar” (ICS download) in UI (does not require Circle API)
- **RSVP state**
  - Ensure RSVP state is reflected immediately with optimistic updates, then reconciled from server response.

### Implementation approach

#### Server routes to add

- `GET /api/community/events/[eventId]/attendees` → `GET /events/{event_id}/event_attendees`
- Recurring:
  - `GET /api/community/spaces/[spaceId]/events/[eventId]/recurring` → `GET /spaces/{space_id}/events/{event_id}/recurring_events`
  - `POST /api/community/spaces/[spaceId]/events/[eventId]/recurring/rsvp` → `POST /spaces/{space_id}/events/{event_id}/recurring_events/rsvp`
- Live:
  - `POST /api/community/live-streams/rooms` → `POST /live_streams/rooms`

#### UI work items

- Add attendees drawer/modal on event detail.
- Add recurring instances list with an RSVP per occurrence (if swagger expects occurrence id/params).
- Add “Join live” CTA for virtual/live room events, gated by event settings.

### Acceptance checklist

- [ ] Attendees list is available on event detail and respects privacy settings.
- [ ] Recurring events are supported: list occurrences + RSVP flow.
- [ ] Live stream room integration is planned and implemented where applicable.


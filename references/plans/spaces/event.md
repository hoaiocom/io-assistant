## Spaces sub-plan: Event spaces

### What an “event space” is

Spaces with `space_type: "event"` typically surface event posts and schedules.

### Relevant Headless Member API (from swagger)

- Space data
  - `GET /api/headless/v1/spaces/{id}`
- Event listing + RSVP (community-scoped)
  - `GET /api/headless/v1/community_events`
  - `GET/POST /api/headless/v1/events/{event_id}/event_attendees`
- Space-scoped recurring events (when enabled)
  - `GET /api/headless/v1/spaces/{space_id}/events/{event_id}/recurring_events`
  - `POST /api/headless/v1/spaces/{space_id}/events/{event_id}/recurring_events/rsvp`

### Current UI implementation (already in repo)

- Space detail routes event spaces to `EventSpaceView`
- Events index page exists (`/community/events`) and uses `community_events`

### Gaps / improvements

- **Event-space “home”**
  - render a space-scoped events feed:
    - upcoming vs past within that space
    - topic filters if topics are used in that space
- **Recurring events**
  - list instances and allow RSVP per instance
- **Attendees**
  - show attendee previews and full list where allowed (`hide_attendees`)

### Acceptance checklist

- [x] Event spaces have a dedicated, space-scoped events view (not only the global events page).  
  Implemented in: `src/app/community/(main)/spaces/[id]/page.tsx`, `src/components/community/EventSpaceView.tsx`
- [ ] Recurring events are supported when the API returns them.  
  Pending: API exists (`GET /api/headless/v1/spaces/{space_id}/events/{event_id}/recurring_events`) but UI slice not implemented yet.
- [x] Attendees view works and respects privacy settings.  
  Implemented in: `src/components/community/EventSpaceView.tsx` (avatar preview + attendees dialog; hidden when `hide_attendees` is true)

### Event post detail page parity (Circle-like sidebar)

- [x] Event post detail page shows a right sidebar (date/time, join live stream, RSVP state, add-to-calendar, attendees preview).  
  Implemented in: `src/app/community/(main)/spaces/[id]/posts/[postId]/page.tsx`

